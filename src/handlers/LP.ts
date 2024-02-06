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
  await processAllLPAccounts(ctx);
  await processLPAccount(evt.args.from, ctx);
  await processLPAccount(evt.args.to, ctx);
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

export async function processAllLPAccounts(ctx: EthContext) {
  // might not need to do this on interval since we are doing it on every swap
  const accountSnapshots = await db.asyncFind<AccountSnapshot>({});
  for (const snapshot of accountSnapshots) {
    await processLPAccount(snapshot._id, ctx);
  }
}

export async function processLPAccount(account: string, ctx: EthContext) {
  if (isLiquidLockerAddress(account)) return;

  const marketContract = getPendleMarketContractOnContext(ctx, PENDLE_POOL_ADDRESSES.LP);
  const timestamp = getUnixTimestamp(ctx.timestamp);
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

  const share = await readUserMarketPosition(account, ctx);
  const totalShare = await marketContract.totalActiveSupply();
  const state = await marketContract.readState(marketContract.address);
  const impliedHolding = (share * state.totalSy) / totalShare;
  const newSnapshot = {
    _id: account,
    lastUpdatedAt: timestamp,
    lastImpliedHolding: impliedHolding.toString(),
  };

  await db.asyncUpdate({ _id: account }, newSnapshot, { upsert: true });
}

async function readUserMarketPosition(
  account: string,
  ctx: EthContext
): Promise<bigint> {
  const marketContract = getPendleMarketContractOnContext(ctx, PENDLE_POOL_ADDRESSES.LP);
  let share = await marketContract.activeBalance(account);
  for (let liquidLocker of PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS) {
    if (liquidLocker.address == MISC_CONSTS.ZERO_ADDRESS) continue;
    try {
      // doing a try catch here since some liquid lockers might be deployed before the others
      const receiptToken = getERC20ContractOnContext(
        ctx,
        liquidLocker.receiptToken
      );
      const userBal = await receiptToken.balanceOf(account);
      const liquidLockerBal = await marketContract.balanceOf(
        liquidLocker.address
      );
      const liquidLockerActiveBal = await marketContract.activeBalance(
        liquidLocker.address
      );
      share += (userBal * liquidLockerActiveBal) / liquidLockerBal;
    } catch (err) {}
  }
  return share;
}
