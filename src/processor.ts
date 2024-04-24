import { Counter, Gauge } from '@sentio/sdk'
import { ERC20Processor } from '@sentio/sdk/eth/builtin'
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from './consts.js'
import { isPendleAddress } from './helper.js'
import { handleSYTransfer } from './handlers/SY.js'
import { PendleYieldTokenProcessor } from './types/eth/pendleyieldtoken.js'
import { handleYTRedeemInterest, handleYTTransfer, processAllYTAccounts } from './handlers/YT.js'
import { PendleMarketProcessor, getPendleMarketContractOnContext } from './types/eth/pendlemarket.js'
import { fetchAccountsAndUpdatePoints, handleLPTransfer, handleMarketRedeemReward, handleMarketSwap } from './handlers/LP.js'
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
}).onEventTransfer(async (evt, ctx) => {
  await handleSYTransfer(evt, ctx);
})

PendleYieldTokenProcessor.bind({
  address: PENDLE_POOL_ADDRESSES.YT,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Pendle Pool YT",
  network: EthChainId.ARBITRUM
}).onEventTransfer(async (evt, ctx) => {
  await handleYTTransfer(evt, ctx);
}).onEventRedeemInterest(async (evt, ctx) => {
  await handleYTRedeemInterest(evt, ctx);
}).onTimeInterval(async (_, ctx) => {
  await processAllYTAccounts(ctx);
}, MISC_CONSTS.ONE_DAY_IN_MINUTE);


for (let market of [PENDLE_POOL_ADDRESSES.LP, PENDLE_POOL_ADDRESSES.LP_NEW]) {
  PendleMarketProcessor.bind({
    address: market,
    startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
    name: "Pendle Pool LP",
    network: EthChainId.ARBITRUM
  }).onEventTransfer(async (evt, ctx) => {
    await handleLPTransfer(evt, ctx);
  }).onEventRedeemRewards(async (evt, ctx) => {
    await handleMarketRedeemReward(evt, ctx);
  }).onEventSwap(async (evt, ctx) => {
    await handleMarketSwap(evt, ctx);
  });
}


EQBBaseRewardProcessor.bind({
  address: PENDLE_POOL_ADDRESSES.EQB_STAKING,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Equilibria Base Reward",
  network: EthChainId.ARBITRUM
}).onEventStaked(async (evt, ctx) => {
  await fetchAccountsAndUpdatePoints(ctx, [evt.args._user]);
}).onEventWithdrawn(async (evt, ctx) => {
  await fetchAccountsAndUpdatePoints(ctx, [evt.args._user]);
})

EQBBaseRewardProcessor.bind({
  address: PENDLE_POOL_ADDRESSES.EQB_STAKING_NEW,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Equilibria Base Reward",
  network: EthChainId.ARBITRUM
}).onEventStaked(async (evt, ctx) => {
  await fetchAccountsAndUpdatePoints(ctx, [evt.args._user]);
}).onEventWithdrawn(async (evt, ctx) => {
  await fetchAccountsAndUpdatePoints(ctx, [evt.args._user]);
})

ERC20Processor.bind({
  address: PENDLE_POOL_ADDRESSES.PENPIE_RECEIPT_TOKEN,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Penpie Receipt Token",
  network: EthChainId.ARBITRUM
}).onEventTransfer(async (evt, ctx) => {
  await fetchAccountsAndUpdatePoints(ctx, [evt.args.from, evt.args.to]);
});

ERC20Processor.bind({
  address: PENDLE_POOL_ADDRESSES.PENPIE_RECEIPT_TOKEN_NEW,
  startBlock: PENDLE_POOL_ADDRESSES.START_BLOCK,
  name: "Penpie Receipt Token",
  network: EthChainId.ARBITRUM
}).onEventTransfer(async (evt, ctx) => {
  await fetchAccountsAndUpdatePoints(ctx, [evt.args.from, evt.args.to]);
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