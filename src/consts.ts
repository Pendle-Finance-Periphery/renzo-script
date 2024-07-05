
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
    SY: "0x9309bcd974cd13457eab1383539b46c93e90b66a",
    YT: "0xa2b4c479c98163bbdbd3987a9f3474bb7bc72f84",
    LPs: [
        {
            address: "0xd3bb297264bd6115ae163db4153038a79d78acba",
            deployedBlock: 20216077            
        },
    ],
    START_BLOCK: 20216077,
    EXPIRY: 1727308800,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    EQB_STAKING: "0xdffb3bafc69bcc4052fb852a6a42b36bef026be3",
    PENPIE_RECEIPT_TOKEN: "0xcd3a483c395c800081914ee01b00d2b52c2b2d8f",

    STAKEDAO_RECEIPT_TOKEN: "0x9e4e11a0d644d5a79f793bcfb38cbbe53b26aeba",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: "0xcd3a483c395c800081914ee01b00d2b52c2b2d8f",
            lpAddress: "0xd3bb297264bd6115ae163db4153038a79d78acba",
            deployedBlock: 20231919
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0xdffb3bafc69bcc4052fb852a6a42b36bef026be3",
            lpAddress: "0xd3bb297264bd6115ae163db4153038a79d78acba",
            deployedBlock: 20173564
        },
        {   // STAKEDAO
            address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
            receiptToken: '0x9e4e11a0d644d5a79f793bcfb38cbbe53b26aeba',
            lpAddress: "0xd3bb297264bd6115ae163db4153038a79d78acba",
            deployedBlock: 20224458
        }
    ],
}