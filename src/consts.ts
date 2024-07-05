
import { EthChainId } from "@sentio/sdk/eth";



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 1000,
}

export const SYNCING_CONFIG = {
    SNAPSHOT_TIMESTAMPS: [1727308800]
}


export const PENDLE_POOL_ADDRESSES = {
    network: EthChainId.ETHEREUM,
    SY: "0x54264c1b0355c71a678d5a171ca796429ddcb4f4",
    YT: "0x96f2e86b6ba7bec41f5ba89d1aa7c7e75d76d1e5",
    LPs: [
        {
            address: "0xd8072f2084f5876d6ec25c423ea71edc0469cce5",
            deployedBlock: 20195130            
        },
    ],
    START_BLOCK: 20195130,
    EXPIRY: 1727308800,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    EQB_STAKING: "0xa88a72d9fcefe69af7f86fbb1b5e338e1989f83e",
    PENPIE_RECEIPT_TOKEN: "0x0c837d66f3e99660a8c932ac85b8e5b1472ebc60",

    // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: "0x0c837d66f3e99660a8c932ac85b8e5b1472ebc60",
            lpAddress: "0xd8072f2084f5876d6ec25c423ea71edc0469cce5",
            deployedBlock: 20223889
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0xa88a72d9fcefe69af7f86fbb1b5e338e1989f83e",
            lpAddress: "0xd8072f2084f5876d6ec25c423ea71edc0469cce5",
            deployedBlock: 20230573
        },
        // {   // STAKEDAO
        //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
        //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
        // }
    ],
}