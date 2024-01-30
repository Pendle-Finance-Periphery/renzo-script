



export const MISC_CONSTS = {
    ONE_E18: BigInt("1000000000000000000"),
    ONE_DAY_IN_MINUTE: 60 * 24,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000"
}


export const PENDLE_POOL_ADDRESSES = {
    SY: "0x22e12a50e3ca49fb183074235cb1db84fe4c716d",
    YT: "0x256fb830945141f7927785c06b65dabc3744213c",
    LP: "0xde715330043799d7a80249660d1e6b61eb3713b3",
    START_BLOCK: 19105379,
    TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
    LIQUID_LOCKERS: [
        {
            address: MISC_CONSTS.ZERO_ADDRESS,
            receiptToken: MISC_CONSTS.ZERO_ADDRESS,
        },
        {
            address: MISC_CONSTS.ZERO_ADDRESS,
            receiptToken: MISC_CONSTS.ZERO_ADDRESS,
        },
        {
            address: MISC_CONSTS.ZERO_ADDRESS,
            receiptToken: MISC_CONSTS.ZERO_ADDRESS,
        }
    ]
}