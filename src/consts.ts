
import { EthChainId } from "@sentio/sdk/eth";



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 2000,
}

export const SYNCING_CONFIG = {
    SNAPSHOT_TIMESTAMPS: [1710460800, 1714132255, 1719327600]
}


export const PENDLE_POOL_ADDRESSES = {
    network: EthChainId.BINANCE,
    SY: "0xe49269b5d31299bce407c8cccf241274e9a93c9a",
    YT: "0x964b6d486a89025e5557a5af3b4cc100a3f9734c",
    LPs: [
        {
            address: "0xb2eea27af50030a445418553c4892065cf3a720a",
            deployedBlock: 38051460            
        },
    ],
    START_BLOCK: 38051460,
    EXPIRY: 1727308800,
    TREASURY: "0xd77e9062c6df3f2d1cb5bf45855fa1e7712a059e",
    EQB_STAKING: "0xd2539f03427dbd70c7cc42b779fa41f994cc4bfa",
    PENPIE_RECEIPT_TOKEN: "0x22f546fb724feb03eb1e2a49109d4a864721dccd",

    // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x782d9d67feaa4d1cdf8222d9053c8cba1c3b7982",
            receiptToken: "0x22f546fb724feb03eb1e2a49109d4a864721dccd",
            lpAddress: "0xb2eea27af50030a445418553c4892065cf3a720a",
            deployedBlock: 38161130
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0xd2539f03427dbd70c7cc42b779fa41f994cc4bfa",
            lpAddress: "0xb2eea27af50030a445418553c4892065cf3a720a",
            deployedBlock: 38103673            
        },
        // {   // STAKEDAO
        //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
        //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
        // }
    ],
}