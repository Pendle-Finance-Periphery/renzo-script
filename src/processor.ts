import { Counter, Gauge } from '@sentio/sdk'
import { ERC20Processor } from '@sentio/sdk/eth/builtin'
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from './consts.js'
import { isPendleAddress } from './helper.js'
import { handleSYTransfer } from './handlers/SY.js'
import { PendleYieldTokenProcessor } from './types/eth/pendleyieldtoken.js'
import { handleYTRedeemInterest, handleYTTransfer, processAllYTAccounts } from './handlers/YT.js'
import { PendleMarketProcessor, getPendleMarketContractOnContext } from './types/eth/pendlemarket.js'
import { handleLPTransfer, handleMarketRedeemReward, handleMarketSwap, processAllLPAccounts } from './handlers/LP.js'
import { EQBBaseRewardProcessor } from './types/eth/eqbbasereward.js'
import { GLOBAL_CONFIG } from "@sentio/runtime";
import { EthChainId } from '@sentio/sdk/eth'

GLOBAL_CONFIG.execution = {
  sequential: true,
};


ERC20Processor.bind({
  address: PENDLE_POOL_ADDRESSES.SY,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Pendle Pool SY",
  network: EthChainId.ARBITRUM
}).onEventTransfer(async(evt, ctx) => {
  await handleSYTransfer(evt, ctx);
})


PendleYieldTokenProcessor.bind({
  address: PENDLE_POOL_ADDRESSES.YT,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Pendle Pool YT",
  network: EthChainId.ARBITRUM

}).onEventTransfer(async(evt, ctx) => {
  await handleYTTransfer(evt, ctx);
}).onEventRedeemInterest(async(evt, ctx) => {
  await handleYTRedeemInterest(evt, ctx);
}).onEventNewInterestIndex(async(_, ctx) => {
  const YTIndex = await ctx.contract.pyIndexStored();
  const YTIndexPreviousBlock = await ctx.contract.pyIndexStored({blockTag: ctx.blockNumber - 1});
  if (YTIndex == YTIndexPreviousBlock) return;
  await processAllYTAccounts(ctx);
});

PendleMarketProcessor.bind({
  address: PENDLE_POOL_ADDRESSES.LP,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Pendle Pool LP",
  network: EthChainId.ARBITRUM
}).onEventTransfer(async(evt, ctx) => {
  await handleLPTransfer(evt, ctx);
}).onEventRedeemRewards(async(evt, ctx) => {
  await handleMarketRedeemReward(evt, ctx);
}).onEventSwap(async(evt, ctx) => {
  await handleMarketSwap(evt, ctx);
});

EQBBaseRewardProcessor.bind({
  address: PENDLE_POOL_ADDRESSES.EQB_STAKING,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Equilibria Base Reward",
  network: EthChainId.ARBITRUM
}).onEventStaked(async(evt, ctx) => {
  await processAllLPAccounts(ctx, [evt.args._user.toLowerCase()]);
}).onEventWithdrawn(async(evt, ctx) => {
  await processAllLPAccounts(ctx, [evt.args._user.toLowerCase()]);
})

ERC20Processor.bind({
  address: PENDLE_POOL_ADDRESSES.PENPIE_RECEIPT_TOKEN,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Pendle Pie Receipt Token",
  network: EthChainId.ARBITRUM
}).onEventTransfer(async(evt, ctx) => {
  await processAllLPAccounts(ctx, [
    evt.args.from.toLowerCase(),
    evt.args.to.toLowerCase(),
  ]);
});

// ERC20Processor.bind({
//   address: PENDLE_POOL_ADDRESSES.STAKEDAO_RECEIPT_TOKEN,
//   startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
//   name: "Stakedao Receipt Token",
// }).onEventTransfer(async(evt, ctx) => {
//   await processAllLPAccounts(ctx, [
//     evt.args.from.toLowerCase(),
//     evt.args.to.toLowerCase(),
//   ]);
// });