import { Counter, Gauge } from "@sentio/sdk";
import { ERC20Processor } from "@sentio/sdk/eth/builtin";
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from "./consts.js";
import { getUnixTimestamp, isPendleAddress } from "./helper.js";
import { handleSYTransfer } from "./handlers/SY.js";
import { PendleYieldTokenProcessor } from "./types/eth/pendleyieldtoken.js";
import {
  handleYTRedeemInterest,
  handleYTTransfer,
  updateAllYTAccounts,
} from "./handlers/YT.js";
import { PendleMarketProcessor } from "./types/eth/pendlemarket.js";
import {
  handleMarketAccounts,
  handleLiquidLockerAccounts,
  updateGlobalPoint,
  updateAllLPAccounts,
} from "./handlers/LP.js";
import { EQBBaseRewardProcessor } from "./types/eth/eqbbasereward.js";
import { GLOBAL_CONFIG } from "@sentio/runtime";
import { EthChainId } from "@sentio/sdk/eth";
import { emitAllPoints } from "./points/point-manager.js";

GLOBAL_CONFIG.execution = {
  sequential: true,
  forceExactBlockTime: true,
};

let batchBeforeExpiryHandled = false;

PendleYieldTokenProcessor.bind({
  address: PENDLE_POOL_ADDRESSES.YT,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Pendle Pool YT",
  network: PENDLE_POOL_ADDRESSES.network,
})
  .onEventTransfer(async (evt, ctx) => {
    await handleYTTransfer(evt, ctx);
  })
  .onEventRedeemInterest(async (evt, ctx) => {
    await handleYTRedeemInterest(evt, ctx);
  })
  .onTimeInterval(
    async (_, ctx) => {
      await updateAllYTAccounts(ctx, [], true);
      await updateAllLPAccounts(ctx);
      await emitAllPoints(ctx);
    },
    60 * 4,
    MISC_CONSTS.ONE_DAY_IN_MINUTE * 7
  )
  .onBlockInterval(
    async (_, ctx) => {
      const diff =
        PENDLE_POOL_ADDRESSES.EXPIRY - getUnixTimestamp(ctx.timestamp);
      if (diff < 0 || diff > 30 || batchBeforeExpiryHandled) return;

      batchBeforeExpiryHandled = true;
      await updateAllYTAccounts(ctx, [], true);
      await updateAllLPAccounts(ctx);
      await emitAllPoints(ctx);
    },
    20,
    10000
  );

for (let marketInfo of PENDLE_POOL_ADDRESSES.LPs) {
  PendleMarketProcessor.bind({
    address: marketInfo.address,
    startBlock: marketInfo.deployedBlock,
    name: "Pendle Pool LP",
    network: PENDLE_POOL_ADDRESSES.network,
  })
    .onEventTransfer(async (evt, ctx) => {
      await handleMarketAccounts(ctx, ctx.address, [
        evt.args.from,
        evt.args.to,
      ]);
    })
    .onEventRedeemRewards(async (evt, ctx) => {
      await handleMarketAccounts(ctx, ctx.address, [evt.args.user]);
    })
    .onEventSwap(async (evt, ctx) => {
      await updateGlobalPoint(ctx);
    });
}

for (let eqb of [
  PENDLE_POOL_ADDRESSES.EQB_STAKING,
]) {
  EQBBaseRewardProcessor.bind({
    address: eqb,
    startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
    name: "Equilibria Base Reward",
    network: PENDLE_POOL_ADDRESSES.network,
  })
    .onEventStaked(async (evt, ctx) => {
      await handleLiquidLockerAccounts(ctx, ctx.address, [evt.args._user]);
    })
    .onEventWithdrawn(async (evt, ctx) => {
      await handleLiquidLockerAccounts(ctx, ctx.address, [evt.args._user]);
    });
}

for (let penpie of [
  PENDLE_POOL_ADDRESSES.PENPIE_RECEIPT_TOKEN,
]) {
  ERC20Processor.bind({
    address: penpie,
    startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
    name: "Penpie Receipt Token",
    network: PENDLE_POOL_ADDRESSES.network,
  }).onEventTransfer(async (evt, ctx) => {
    await handleLiquidLockerAccounts(ctx, ctx.address, [
      evt.args.from,
      evt.args.to,
    ]);
  });
}
