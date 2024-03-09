



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 256,
}


export const PENDLE_POOL_ADDRESSES = {
    SY: "0x0de802e3d6cc9145a150bbdc8da9f988a98c5202",
    YT: "0x05735b65686635f5c87aa9d2dae494fb2e838f38",
    LP: "0x60712e3c9136cf411c561b4e948d4d26637561e7",
    START_BLOCK: 187579951,
    TREASURY: "0xcbcb48e22622a3778b6f14c2f5d258ba026b05e6",
    EQB_STAKING: "0xfaaec6bb2d8cb33825ec4f077d71089f3a2a7f7a",
    PENPIE_RECEIPT_TOKEN: "0xf5250766b344568f8b4d783b7cbbc6415e93dd4d",
    // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: "0xf5250766b344568f8b4d783b7cbbc6415e93dd4d",
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0xfaaec6bb2d8cb33825ec4f077d71089f3a2a7f7a",
        },
        // {   // STAKEDAO
        //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
        //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
        // }
    ]
}