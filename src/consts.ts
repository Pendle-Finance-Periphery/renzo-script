



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    MULTICALL_BATCH: 256,
}


export const PENDLE_POOL_ADDRESSES = {
    SY: "0x22e12a50e3ca49fb183074235cb1db84fe4c716d",
    YT: "0x256fb830945141f7927785c06b65dabc3744213c",
    LP: "0xde715330043799d7a80249660d1e6b61eb3713b3",
    START_BLOCK: 19105379,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    EQB_STAKING: "0xaa4a7ac0f9d4fcc55138ad7da4fb2a8dd4790b74",
    PENPIE_RECEIPT_TOKEN: "0x788d39ebe18bcd1323b9e879fc87ca24746223db",
    MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
    LIQUID_LOCKERS: [
        {
            // Penpie
            address: "0x6e799758cee75dae3d84e09d40dc416ecf713652",
            receiptToken: "0x788d39ebe18bcd1323b9e879fc87ca24746223db",
        },
        {
            // EQB
            address: '0x64627901dadb46ed7f275fd4fc87d086cff1e6e3',
            receiptToken: "0xaa4a7ac0f9d4fcc55138ad7da4fb2a8dd4790b74",
        },
        {
            address: MISC_CONSTS.ZERO_ADDRESS,
            receiptToken: MISC_CONSTS.ZERO_ADDRESS,
        }
    ]
}