import { LogLevel } from "@sentio/sdk";
import { EthContext } from "@sentio/sdk/eth";
import { PENDLE_POOL_ADDRESSES } from "../consts.js";
import { POINT_SOURCE, PointAmounts } from "../types.js";
import { AsyncNedb } from "nedb-async";
import { addBigInt, getDbPath, getUnixTimestamp } from "../helper.js";

const TIMESTAMP_4X_BOOST = 1714132255;

/**
 *
 * @param amountEzEthHolding amount of Ez Eth user holds during the period
 * @param holdingPeriod amount of time user holds the Ez Eth
 * @returns EZ point & Eigen Layer point
 *
 * @dev to be modified by renzo team
 */
export function calcPointsFromHolding(
  ctx: EthContext,
  amountEzEthHolding: bigint,
  holdingPeriod: bigint
): PointAmounts {
  const ezMultiplier = getUnixTimestamp(ctx.timestamp) > TIMESTAMP_4X_BOOST ? 4n : 2n;
  return {
    ezPoint: (amountEzEthHolding * holdingPeriod * ezMultiplier) / 3600n,
    elPoint: (amountEzEthHolding * holdingPeriod) / 3600n,
  };
}

const accountPointDb = new AsyncNedb({
  filename: getDbPath("account-points"),
  autoload: true,
});
accountPointDb.persistence.setAutocompactionInterval(60 * 1000);

type AccountPoint = {
  _id: string;
  accruedEz: string;
  accruedEl: string;
};

export async function updateUserPoint(
  account: string,
  label: POINT_SOURCE,
  points: PointAmounts
): Promise<void> {
  const _id = `${account}-${label}`;
  const snapshot = await accountPointDb.asyncFindOne<AccountPoint>({ _id });
  if (!snapshot) {
    await accountPointDb.asyncUpdate(
      { _id },
      {
        _id,
        accruedEz: points.ezPoint.toString(),
        accruedEl: points.elPoint.toString(),
      },
      { upsert: true }
    );
  } else {
    await accountPointDb.asyncUpdate(
      { _id },
      {
        _id,
        accruedEz: addBigInt(snapshot.accruedEz, points.ezPoint),
        accruedEl: addBigInt(snapshot.accruedEl, points.elPoint),
      }
    );
  }
}

export async function emitAllPoints(ctx: EthContext): Promise<void> {
  const allPoints = await accountPointDb.asyncFind<AccountPoint>({});
  await Promise.all(
    allPoints.map(async (point) => {
      const account = point._id.split("-")[0];
      const label = point._id.split("-")[1] as POINT_SOURCE;

      const ezPoint = BigInt(point.accruedEz).scaleDown(18);
      const elPoint = BigInt(point.accruedEl).scaleDown(18);

      ctx.eventLogger.emit("point_increase", {
        account,
        label,
        ezPoint,
        elPoint,
      });

      await accountPointDb.asyncUpdate(
        { _id: point._id },
        { $set: { accruedEz: "0", accruedEl: "0" } }
      );
    })
  );
}