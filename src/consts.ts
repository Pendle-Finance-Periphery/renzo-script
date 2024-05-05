
import { EthChainId } from "@sentio/sdk/eth";



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 2000,
}


export const PENDLE_POOL_ADDRESSES = {
    network: EthChainId.ETHEREUM,
    SY: "0x22e12a50e3ca49fb183074235cb1db84fe4c716d",
    YT: "0x7749f5ed1e356edc63d469c2fcac9adeb56d1c2b",
    LPs: [
        {
            address: "0xd8f12bcde578c653014f27379a6114f67f0e445f",
            deployedBlock: 19703129            
        },
    ],
    START_BLOCK: 19703129,
    EXPIRY: 1735171200,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    EQB_STAKING: "0x9fe99f1071b01bc04bbad0d48b59ca0e7b23e0b1",
    PENPIE_RECEIPT_TOKEN: "0xa809f81b1d9278b7dd0eb88df64cdb474966dbe1",

    // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: "0xa809f81b1d9278b7dd0eb88df64cdb474966dbe1",
            lpAddress: "0xd8f12bcde578c653014f27379a6114f67f0e445f",
            deployedBlock: 19714868
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0x9fe99f1071b01bc04bbad0d48b59ca0e7b23e0b1",
            lpAddress: "0xd8f12bcde578c653014f27379a6114f67f0e445f",
            deployedBlock: 19716418
        },
        // {   // STAKEDAO
        //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
        //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
        // }
    ],
}