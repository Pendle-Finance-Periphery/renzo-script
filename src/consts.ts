
import { EthChainId } from "@sentio/sdk/eth";



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 1000,
}

type PendleLiquidLockers = {
    network: EthChainId,
    SY: string,
    YT: string,
    LPs: {
        address: string,
        deployedBlock: number
    }[],
    START_BLOCK: number,
    EXPIRY: number,
    TREASURY: string,
    EQB_STAKING: string,
    PENPIE_RECEIPT_TOKEN: string,
    MULTICALL: string,
    LIQUID_LOCKERS: {
        address: string,
        receiptToken: string,
        lpAddress: string,
        deployedBlock: number
    }[],

}

export const PENDLE_POOL_ADDRESSES: PendleLiquidLockers = {
    network: EthChainId.ETHEREUM,
    SY: "0x22e12a50e3ca49fb183074235cb1db84fe4c716d",
    YT: "0x1623f1a991584a6b69babbdbffd26e2b46485465",
    LPs: [
        {
            address: "0xcdbd5ff3e03b6828db9c32e2131a60aba5137901",
            deployedBlock: 19866157            
        },
    ],
    START_BLOCK: 19866157,
    EXPIRY: 1727308800,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    EQB_STAKING: '0x524be708c4731af532dfed1ae3f0c599733d5c01',
    PENPIE_RECEIPT_TOKEN: '0xd361ff93ad7112ddf3c3bded94bab4eb364e31cd',

    // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: '0xd361ff93ad7112ddf3c3bded94bab4eb364e31cd',
            lpAddress: "0xcdbd5ff3e03b6828db9c32e2131a60aba5137901",
            deployedBlock: 19881498
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: '0x524be708c4731af532dfed1ae3f0c599733d5c01',
            lpAddress: "0xcdbd5ff3e03b6828db9c32e2131a60aba5137901",
            deployedBlock: 19910309
        },
        // {   // STAKEDAO
        //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
        //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
        // }
    ],
}