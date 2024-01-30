import { LogLevel } from "@sentio/sdk";
import { EthContext } from "@sentio/sdk/eth";
import { PENDLE_POOL_ADDRESSES } from "../consts.js";

/**
 *
 * @param amountEzEthHolding amount of Ez Eth user holds during the period
 * @param holdingPeriod amount of time user holds the Ez Eth
 * @returns EZ point & Eigen Layer point
 *
 * @dev to be modified by renzo team
 */
function calcPointsFromHolding(
  amountEzEthHolding: bigint,
  holdingPeriod: bigint
): [bigint, bigint] {
  return [
    amountEzEthHolding * holdingPeriod,
    amountEzEthHolding * holdingPeriod,
  ];
}

export async function updatePoints(
  ctx: EthContext,
  label: string,
  account: string,
  amountEzEthHolding: bigint,
  holdingPeriod: bigint,
  updatedAt: number
) {
  const [ezPoint, elPoint] = calcPointsFromHolding(
    amountEzEthHolding,
    holdingPeriod
  );

  if (label == "YT") {
    const ezPointTreasuryFee = calcTreasuryFee(ezPoint);
    const elPointTreasuryFee = calcTreasuryFee(elPoint);
    increasePoint(
      ctx,
      label,
      account,
      ezPoint - ezPointTreasuryFee,
      elPoint - elPointTreasuryFee,
      updatedAt
    );
    increasePoint(
      ctx,
      label,
      PENDLE_POOL_ADDRESSES.TREASURY,
      ezPointTreasuryFee,
      elPointTreasuryFee,
      updatedAt
    );
  } else {
    increasePoint(ctx, label, account, ezPoint, elPoint, updatedAt);
  }
}

function increasePoint(
  ctx: EthContext,
  label: string,
  account: string,
  ezPoint: bigint,
  elPoint: bigint,
  updatedAt: number
) {
  ctx.eventLogger.emit("point_increase", {
    label,
    account: account.toLowerCase(),
    ezPoint,
    elPoint,
    updatedAt,
    severity: LogLevel.INFO,
  });
}

function calcTreasuryFee(amount: bigint): bigint {
  return (amount * 3n) / 100n;
}
