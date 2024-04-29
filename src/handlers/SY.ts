import { AsyncNedb } from "nedb-async";
import { TransferEvent } from "../types/eth/pendlemarket.js";
import { ERC20Context } from "@sentio/sdk/eth/builtin/erc20";
import { getDbPath, getUnixTimestamp, isPendleAddress } from "../helper.js";
import { EVENT_USER_SHARE, POINT_SOURCE_SY } from "../types.js";
import { calcPointsFromHolding, updateUserPoint } from "../points/point-manager.js";

/**
 * @dev 1 SY EZETH = 1 EZETH
 */

const db = new AsyncNedb({
  filename: getDbPath("pendle-accounts-sy"),
  autoload: true,
});

db.persistence.setAutocompactionInterval(60 * 1000);


type AccountSnapshot = {
  _id: string;
  lastUpdatedAt: number;
  lastBalance: string;
};

export async function handleSYTransfer(evt: TransferEvent, ctx: ERC20Context) {
  await processAccount(evt.args.from, ctx);
  await processAccount(evt.args.to, ctx);
}

export async function processAllAccounts(ctx: ERC20Context) {
  const accountSnapshots = await db.asyncFind<AccountSnapshot>({});
  await Promise.all(
    accountSnapshots.map((snapshot) => processAccount(snapshot._id, ctx))
  );
}

async function processAccount(account: string, ctx: ERC20Context) {
  if (isPendleAddress(account)) return;
  const timestamp = getUnixTimestamp(ctx.timestamp);

  const snapshot = await db.asyncFindOne<AccountSnapshot>({ _id: account });
  if (snapshot && snapshot.lastUpdatedAt < timestamp) {
    const points = calcPointsFromHolding(
      ctx, BigInt(snapshot.lastBalance), BigInt(timestamp - snapshot.lastUpdatedAt)
    )
    await updateUserPoint(account, POINT_SOURCE_SY, points);
  }

  const newBalance = await ctx.contract.balanceOf(account);

  const newSnapshot = {
    _id: account,
    lastUpdatedAt: timestamp,
    lastBalance: newBalance.toString(),
  };
  await db.asyncUpdate({ _id: account }, newSnapshot, { upsert: true });
}
