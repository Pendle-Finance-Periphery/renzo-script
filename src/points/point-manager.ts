import { LogLevel } from "@sentio/sdk";
import { EthContext } from "@sentio/sdk/eth";
import { PENDLE_POOL_ADDRESSES } from "../consts.js";
import { POINT_SOURCE, PointAmounts } from "../types.js";
import { AsyncNedb } from "nedb-async";
import { addBigInt, getDbPath, getUnixTimestamp } from "../helper.js";
import { AccountPoint } from "../schema/schema.ts"

const TIMESTAMP_225_BOOST = 1720569600;

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
  let timestamp = getUnixTimestamp(ctx.timestamp);

  let ezPoint = (amountEzEthHolding * holdingPeriod) / 3600n;
  if (timestamp < TIMESTAMP_225_BOOST) {
    ezPoint = ezPoint * 3n;
  } else {  
    ezPoint = ezPoint * 225n / 100n;
  }


  return {
    ezPoint,
    elPoint: (amountEzEthHolding * holdingPeriod) / 3600n,
  };
}

export async function updateUserPoint(
  ctx: EthContext,
  account: string,
  label: POINT_SOURCE,
  points: PointAmounts
): Promise<void> {
  const _id = `${account}-${label}`;
  const snapshot = await ctx.store.get(AccountPoint, _id);
  if (!snapshot) {

    const newSnapshot = new AccountPoint({
      id: _id,
      accruedEz: points.ezPoint,
      accruedEl: points.elPoint,
    })

    await ctx.store.upsert(newSnapshot);
  } else {
    
    snapshot.accruedEz += points.ezPoint;
    snapshot.accruedEl += points.elPoint;
    await ctx.store.upsert(snapshot);
  }
}

export async function emitAllPoints(ctx: EthContext): Promise<void> {
  const allPoints = await ctx.store.list(AccountPoint, [])
  await Promise.all(
    allPoints.map(async (point) => {
      const account = point.id.toString().split("-")[0];
      const label = point.id.toString().split("-")[1] as POINT_SOURCE;

      const ezPoint = BigInt(point.accruedEz).scaleDown(18);
      const elPoint = BigInt(point.accruedEl).scaleDown(18);

      ctx.eventLogger.emit("point_increase", {
        account,
        label,
        ezPoint,
        elPoint,
        severity: LogLevel.INFO
      });

      
      point.accruedEz = 0n;
      point.accruedEl = 0n;
      await ctx.store.upsert(point);
    })
  );
}