import { TestProcessorServer } from '@sentio/sdk/testing'
import { mockTransferLog } from './types/eth/pendlemarket.js'
import { EthChainId } from '@sentio/sdk/eth'
import { PENDLE_POOL_ADDRESSES } from './consts.js'

describe('Test Processor', () => {
    const service = new TestProcessorServer(() => import('./processor.js'), {
        42161: 'https://rpc.ankr.com/arbitrum'
    })

    beforeAll(async () => {
        await service.start()
    })

    test('has config', async () => {
        await service.eth.testBlock(blockData, EthChainId.ARBITRUM)
        await service.eth.testBlock(blockData2, EthChainId.ARBITRUM)
        // await service.eth.testLog({
        //     transactionHash: '0xf3c0f900f974761fc4ac0208d102000c34071bdb90e474d52a97be07045d5945',
        //     blockHash: '0x8da3318ed5b9ba821070037f239bdc6e401f4a30fed40d41430fc79b279a1657',
        //     blockNumber: BLOCK_NUMBER + 1000,
        //     removed: false,
        //     address: PENDLE_POOL_ADDRESSES.LPs[0].address,
        //     data: '0x000000000000000000000000000000000000000000000000004caf17d998f10effffffffffffffffffffffffffffffffffffffffffffffffffb4511eebbbf96c0000000000000000000000000000000000000000fe55cd8544b442b5b2d0944c000000000000000000000000000000000000000000000063eadcf9c2ee507fb6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7d',
        //     topics: ["0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67", "0x00000000000000000000000011ddd59c33c73c44733b4123a86ea5ce57f6e854", "0x00000000000000000000000011ddd59c33c73c44733b4123a86ea5ce57f6e854"],
        //     index: 1,
        //     transactionIndex: 1,

        // }, EthChainId.ARBITRUM)
    })
})

const BLOCK_NUMBER = 195418263
const TIMESTAMP = 1714348800 - 1

const blockData = {
    hash: '0x2b9b7cce1f17f3b7e1f3c2472cc806a07bee3f0baca07d021350950d81d73a42',
    parentHash: '0x2b9b7cce1f17f3b7e1f3c2472cc806a07bee3f0baca07d021350950d81d73a41',
    difficulty: 1n,
    number: BLOCK_NUMBER,
    timestamp: TIMESTAMP,
    extraData: '0xe4b883e5bda9e7a59ee4bb99e9b1bc493421',
    nonce: '0x689056015818adbe',
    gasLimit: 0n,
    gasUsed: 0n,
    miner: '0xbb7b8287f3f0a933474a79eae42cbca977791171',
    baseFeePerGas: null,
    transactions: [],
}

const blockData2 = {
    hash: '0x2b9b7cce1f17f3b7e1f3c2472cc806a07bee3f0baca07d021350950d81d73a42',
    parentHash: '0x2b9b7cce1f17f3b7e1f3c2472cc806a07bee3f0baca07d021350950d81d73a41',
    difficulty: 1n,
    number: BLOCK_NUMBER + 1,
    timestamp: TIMESTAMP + 86400,
    extraData: '0xe4b883e5bda9e7a59ee4bb99e9b1bc493421',
    nonce: '0x689056015818adbe',
    gasLimit: 0n,
    gasUsed: 0n,
    miner: '0xbb7b8287f3f0a933474a79eae42cbca977791171',
    baseFeePerGas: null,
    transactions: [],
}