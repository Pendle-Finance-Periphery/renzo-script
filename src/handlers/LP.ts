import { AsyncNedb } from "nedb-async";
import {
  PendleMarketContext,
  RedeemRewardsEvent,
  SwapEvent,
  TransferEvent,
} from "../types/eth/pendlemarket.js";
import { updatePoints } from "../points/point-manager.js";
import { getUnixTimestamp, isLiquidLockerAddress } from "../helper.js";
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from "../consts.js";
import { getERC20ContractOnContext } from "@sentio/sdk/eth/builtin/erc20";

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
  await processAccount(evt.args.from, ctx);
  await processAccount(evt.args.to, ctx);
}

export async function handleMarketRedeemReward(
  evt: RedeemRewardsEvent,
  ctx: PendleMarketContext
) {
  await processAccount(evt.args.user, ctx);
}

export async function handleMarketSwap(_: SwapEvent, ctx: PendleMarketContext) {
  await processAllAccounts(ctx);
}

async function processAllAccounts(ctx: PendleMarketContext) {
  // might not need to do this on interval since we are doing it on every swap
  const accountSnapshots = await db.asyncFind<AccountSnapshot>({});
  for (const snapshot of accountSnapshots) {
    await processAccount(snapshot._id, ctx);
  }
}

async function processAccount(account: string, ctx: PendleMarketContext) {
  if (isLiquidLockerAddress(account)) return;

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
  const totalShare = await ctx.contract.totalActiveSupply();
  const state = await ctx.contract.readState(ctx.contract.address);
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
  ctx: PendleMarketContext
): Promise<bigint> {
  let share = await ctx.contract.activeBalance(account);
  for (let liquidLocker of PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS) {
    if (liquidLocker.address == MISC_CONSTS.ZERO_ADDRESS) continue;
    try {
      // doing a try catch here since some liquid lockers might be deployed before the others
      const receiptToken = getERC20ContractOnContext(
        ctx,
        liquidLocker.receiptToken
      );
      const userBal = await receiptToken.balanceOf(account);
      const liquidLockerBal = await ctx.contract.balanceOf(
        liquidLocker.address
      );
      const liquidLockerActiveBal = await ctx.contract.activeBalance(
        liquidLocker.address
      );
      share += (userBal * liquidLockerActiveBal) / liquidLockerBal;
    } catch (err) {}
  }
  return share;
}
