
import { EthChainId } from "@sentio/sdk/eth";



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 1000,
}

export const SYNCING_CONFIG = {
    SNAPSHOT_TIMESTAMPS: [1710460800, 1714132255, 1719327600]
}


export const PENDLE_POOL_ADDRESSES = {
    network: EthChainId.ETHEREUM,
    SY: "0x7a493be5c2ce014cd049bf178a1ac0db1b434744",
    YT: "0x87baf4b42c075db7eb1932a0a49a5465e9a5ce9f",
    LPs: [
        {
            address: "0xee6bdfac6767efef0879b924fea12a3437d281a2",
            deployedBlock: 20158641            
        },
    ],
    START_BLOCK: 20158641,
    EXPIRY: 1724284800,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    EQB_STAKING: "0xd64c8d303ce9d0b6da9261be55e408f26c15f0d8",
    PENPIE_RECEIPT_TOKEN: "0x75cb79a5546fafae16e968e1e81c7dcb51844674",

    // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: "0x75cb79a5546fafae16e968e1e81c7dcb51844674",
            lpAddress: "0xee6bdfac6767efef0879b924fea12a3437d281a2",
            deployedBlock: 20173903
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0xd64c8d303ce9d0b6da9261be55e408f26c15f0d8",
            lpAddress: "0xee6bdfac6767efef0879b924fea12a3437d281a2",
            deployedBlock: 20173564
        },
        // {   // STAKEDAO
        //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
        //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
        // }
    ],
}