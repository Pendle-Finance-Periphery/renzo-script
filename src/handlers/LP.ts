import { AsyncNedb } from "nedb-async";
import {
  PendleMarketContext,
  RedeemRewardsEvent,
  SwapEvent,
  TransferEvent,
  getPendleMarketContractOnContext,
} from "../types/eth/pendlemarket.js";
import { updatePoints } from "../points/point-manager.js";
import { getUnixTimestamp, isLiquidLockerAddress, isPendleAddress, isSentioInternalError } from "../helper.js";
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from "../consts.js";
import { getERC20ContractOnContext } from "@sentio/sdk/eth/builtin/erc20";
import { EthContext } from "@sentio/sdk/eth";
import { getMulticallContractOnContext } from "../types/eth/multicall.js";
import { readAllUserActiveBalances, readAllUserERC20Balances } from "../multicall.js";
import { EVENT_USER_SHARE, POINT_SOURCE_LP } from "../types.js";

/**
 * @dev 1 LP = (X PT + Y SY) where X and Y are defined by market conditions
 * So same as Balancer LPT, we need to update all positions on every swap
 *
 * Users can further deposit LP to liquid lockers to get back receipt tokens.
 * This should also be handled here.
 *
 * Currently for all liquid lockers, 1 receipt token = 1 LP
 */

const db = new AsyncNedb({
  filename: "/data/pendle-accounts-lp.db",
  autoload: true,
});

const activeBalanceDb = new AsyncNedb({
  filename: "/data/pendle-active-balances-lp.db",
  autoload: true,
});


db.persistence.setAutocompactionInterval(60 * 1000);
activeBalanceDb.persistence.setAutocompactionInterval(60 * 1000);

type AccountSnapshot = {
  _id: string;
  lastUpdatedAt: number;
  lastImpliedHolding: string;
};

type AccountActiveBalance = {
  _id: string;
  activeBalances: string[];
  liquidLockerTokenBalances: string[];
}

export async function handleLPTransfer(
  evt: TransferEvent,
  ctx: PendleMarketContext
) {
  await fetchAccountsAndUpdatePoints(ctx, [evt.args.from, evt.args.to]);
}

export async function handleMarketRedeemReward(
  evt: RedeemRewardsEvent,
  ctx: PendleMarketContext
) {
  await fetchLatestAccountActiveBalance(ctx, evt.args.user);
  await updateAllUserPoints(ctx);
}

export async function handleMarketSwap(_: SwapEvent, ctx: PendleMarketContext) {
  await updateAllUserPoints(ctx);
}

export async function fetchAccountsAndUpdatePoints(ctx: EthContext, accounts: string[]): Promise<void> {
  await Promise.all(accounts.map((account) => fetchLatestAccountActiveBalance(ctx, account)));
  await updateAllUserPoints(ctx);
}

async function updateAllUserPoints(ctx: EthContext) {
  const allActiveBalances = await activeBalanceDb.asyncFind<AccountActiveBalance>({});
  const allSnapshots = await db.asyncFind<AccountSnapshot>({});

  const accountSnapshots = new Map<string, AccountSnapshot>();
  allSnapshots.forEach((snapshot) => {
    accountSnapshots.set(snapshot._id, snapshot);
  });

  const metadats = await getMarketMetadatas(ctx);
  for (let activeBalanceInfo of allActiveBalances) {
    const account = activeBalanceInfo._id;
    const activeBalances = activeBalanceInfo.activeBalances.map((bal) => BigInt(bal));
    const liquidLockerTokenBalances = activeBalanceInfo.liquidLockerTokenBalances.map((bal) => BigInt(bal));

    let impliedHolding = 0n;
    for (let i = 0; i < activeBalances.length; ++i) {
      if (activeBalances[i] == 0n) continue;
      const marketInfo = metadats.marketInfos[i];
      impliedHolding += (activeBalances[i] * marketInfo.totalSy) / marketInfo.totalActiveSupply;
    }

    for (let i = 0; i < liquidLockerTokenBalances.length; ++i) {
      if (liquidLockerTokenBalances[i] == 0n) continue;
      const liquidLockerInfo = metadats.liquidLockerInfos[i];
      impliedHolding += (liquidLockerTokenBalances[i] * liquidLockerInfo.totalSy) / liquidLockerInfo.totalSupply;
    }

    await updateAccount(ctx, account, impliedHolding, getUnixTimestamp(ctx.timestamp));
  }
}

async function updateAccount(
  ctx: EthContext,
  account: string,
  impliedSy: bigint,
  timestamp: number
) {
  const snapshot = await db.asyncFindOne<AccountSnapshot>({ _id: account });
  if (snapshot && snapshot.lastUpdatedAt < timestamp) {
    updatePoints(
      ctx,
      POINT_SOURCE_LP,
      account,
      BigInt(snapshot.lastImpliedHolding),
      BigInt(timestamp - snapshot.lastUpdatedAt),
      timestamp
    );
  }
  const newSnapshot = {
    _id: account,
    lastUpdatedAt: timestamp,
    lastImpliedHolding: impliedSy.toString(),
  };
  await db.asyncUpdate({ _id: account }, newSnapshot, { upsert: true });
}

async function getMarketMetadatas(ctx: EthContext) {
  const marketInfos = [];
  const liquidLockerInfos = [];

  for (const lpToken of [PENDLE_POOL_ADDRESSES.LP, PENDLE_POOL_ADDRESSES.LP_NEW]) {
    const info = {
      totalActiveSupply: 0n,
      totalSy: 0n,
    }
    try {
      const marketContract = getPendleMarketContractOnContext(ctx, lpToken);
      info.totalActiveSupply = await marketContract.totalActiveSupply();
      const state = await marketContract.readState(marketContract.address);
      info.totalSy = state.totalSy;
    } catch (err) {
      if (isSentioInternalError(err)) {
        throw err;
      }
    }
    marketInfos.push(info);
  }

  for (const liquidLocker of PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS) {
    const info = {
      totalSupply: 0n,
      totalSy: 0n,
    }
    try {
      const receiptToken = getERC20ContractOnContext(ctx, liquidLocker.receiptToken);
      const marketContract = getPendleMarketContractOnContext(ctx, liquidLocker.lpAddress);
      const state = await marketContract.readState(marketContract.address);
      const activeBalance = await marketContract.activeBalance(liquidLocker.address);
      const totalActiveSupply = await marketContract.totalActiveSupply();

      info.totalSupply = await receiptToken.totalSupply();
      info.totalSy = activeBalance * state.totalSy / totalActiveSupply;
    } catch (err) {
      if (isSentioInternalError(err)) {
        throw err;
      }
    }
    liquidLockerInfos.push(info);
  }

  return {
    marketInfos,
    liquidLockerInfos,
  }
}

async function fetchLatestAccountActiveBalance(ctx: EthContext, account: string): Promise<void> {
  account = account.toLowerCase();
  if (account == MISC_CONSTS.ZERO_ADDRESS || isPendleAddress(account) || isLiquidLockerAddress(account)) return;

  const accountActiveBalance: AccountActiveBalance = {
    _id: account,
    activeBalances: [],
    liquidLockerTokenBalances: [],
  };

  for (const lpToken of [PENDLE_POOL_ADDRESSES.LP, PENDLE_POOL_ADDRESSES.LP_NEW]) {
    let bal = 0n;
    try {
      const marketContract = getPendleMarketContractOnContext(ctx, lpToken);
      bal = await marketContract.activeBalance(account);
    } catch (err) {
      if (isSentioInternalError(err)) {
        throw err;
      }
    }
    accountActiveBalance.activeBalances.push(bal.toString());
  }

  for (const liquidLocker of PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS) {
    let bal = 0n;
    try {
      const receiptToken = getERC20ContractOnContext(ctx, liquidLocker.receiptToken);
      bal = await receiptToken.balanceOf(account);
    } catch (err) {
      if (isSentioInternalError(err)) {
        throw err;
      }
    }
    accountActiveBalance.liquidLockerTokenBalances.push(bal.toString());
  }
  await activeBalanceDb.asyncUpdate({ _id: account }, accountActiveBalance, { upsert: true });
}

