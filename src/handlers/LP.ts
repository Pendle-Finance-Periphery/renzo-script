import { AsyncNedb } from "nedb-async";
import {
  PendleMarketContext,
  RedeemRewardsEvent,
  SwapEvent,
  TransferEvent,
  getPendleMarketContractOnContext,
} from "../types/eth/pendlemarket.js";
import { updatePoints } from "../points/point-manager.js";
import { getUnixTimestamp, isLiquidLockerAddress } from "../helper.js";
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from "../consts.js";
import { getERC20ContractOnContext } from "@sentio/sdk/eth/builtin/erc20";
import { EthContext } from "@sentio/sdk/eth";
import { getMulticallContractOnContext } from "../types/eth/multicall.js";

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
type AccountSnapshot = {
  _id: string;
  lastUpdatedAt: number;
  lastImpliedHolding: string;
};

export async function handleLPTransfer(
  evt: TransferEvent,
  ctx: PendleMarketContext
) {
  await processAllLPAccounts(ctx, [
    evt.args.from.toLowerCase(),
    evt.args.to.toLowerCase(),
  ]);
}

export async function handleMarketRedeemReward(
  evt: RedeemRewardsEvent,
  ctx: PendleMarketContext
) {
  await processAllLPAccounts(ctx);
}

export async function handleMarketSwap(_: SwapEvent, ctx: PendleMarketContext) {
  await processAllLPAccounts(ctx);
}

export async function processAllLPAccounts(
  ctx: EthContext,
  addressesToAdd: string[] = []
) {
  // might not need to do this on interval since we are doing it on every swap
  const allAddresses = (await db.asyncFind<AccountSnapshot>({}))
    .map((snapshot) => snapshot._id)

  for(let address of addressesToAdd) {
    address = address.toLowerCase()
    if(!allAddresses.includes(address)) {
      allAddresses.push(address)
    }
  }
  const marketContract = getPendleMarketContractOnContext(
    ctx,
    PENDLE_POOL_ADDRESSES.LP
  );

  const [allUserShares, totalShare, state] = await Promise.all([
    readAllUserActiveBalances(ctx, allAddresses),
    marketContract.totalActiveSupply(),
    marketContract.readState(marketContract.address),
  ]);

  for (const liquidLocker of PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS) {
    const liquidLockerBal = await marketContract.balanceOf(
      liquidLocker.address
    );
    if (liquidLockerBal == 0n) continue;

    const liquidLockerActiveBal = await marketContract.activeBalance(
      liquidLocker.address
    );
    try {
      const allUserReceiptTokenBalances = await readAllUserERC20Balances(
        ctx,
        allAddresses,
        liquidLocker.receiptToken
      );
      for (let i = 0; i < allAddresses.length; i++) {
        const userBal = allUserReceiptTokenBalances[i];
        const userBoostedHolding =
          (userBal * liquidLockerActiveBal) / liquidLockerBal;
        allUserShares[i] += userBoostedHolding;
      }
    } catch (err) {}
  }

  const timestamp = getUnixTimestamp(ctx.timestamp);
  for (let i = 0; i < allAddresses.length; i++) {
    const account = allAddresses[i];
    const impliedSy = (allUserShares[i] * state.totalSy) / totalShare;
    await updateAccount(ctx, account, impliedSy, timestamp);
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
      "LP",
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

async function readAllUserActiveBalances(
  ctx: EthContext,
  allAddresses: string[]
): Promise<bigint[]> {
  const res: bigint[] = [];

  const multicall = getMulticallContractOnContext(
    ctx,
    PENDLE_POOL_ADDRESSES.MULTICALL
  );
  const market = getPendleMarketContractOnContext(
    ctx,
    PENDLE_POOL_ADDRESSES.LP
  );

  for (let i = 0; i < allAddresses.length; i += MISC_CONSTS.MULTICALL_BATCH) {
    const batch = allAddresses.slice(i, i + MISC_CONSTS.MULTICALL_BATCH);
    const calls = batch.map((address) => {
      return {
        target: market.address,
        callData: market.rawContract.interface.encodeFunctionData(
          "activeBalance",
          [address]
        ),
      };
    });
    const output = await multicall.callStatic.tryAggregate(true, calls);
    res.push(
      ...output.map((d) => {
        return BigInt(d.returnData);
      })
    );
  }
  return res;
}

async function readAllUserERC20Balances(
  ctx: EthContext,
  allAddresses: string[],
  tokenAddress: string
): Promise<bigint[]> {
  const res: bigint[] = [];

  const multicall = getMulticallContractOnContext(
    ctx,
    PENDLE_POOL_ADDRESSES.MULTICALL
  );
  const erc20 = getERC20ContractOnContext(ctx, tokenAddress);

  for (let i = 0; i < allAddresses.length; i += MISC_CONSTS.MULTICALL_BATCH) {
    const batch = allAddresses.slice(i, i + MISC_CONSTS.MULTICALL_BATCH);
    const calls = batch.map((address) => {
      return {
        target: erc20.address,
        callData: erc20.rawContract.interface.encodeFunctionData("balanceOf", [
          address,
        ]),
      };
    });
    const output = await multicall.callStatic.tryAggregate(true, calls);
    res.push(
      ...output.map((d) => {
        return BigInt(d.returnData);
      })
    );
  }
  return res;
}
