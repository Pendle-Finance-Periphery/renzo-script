import { EthChainId } from "@sentio/sdk/eth";

export const MISC_CONSTS = {
  ONE_E18: BigInt("1000000000000000000"),
  ONE_DAY_IN_MINUTE: 60 * 24,
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  MULTICALL_BATCH: 1000,
};

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
};

export const SYNCING_CONFIG = {
    SNAPSHOT_TIMESTAMPS: [1710460800, 1714132255, 1719327600]
}


export const PENDLE_POOL_ADDRESSES: PendleLiquidLockers = {
  network: EthChainId.ARBITRUM,
  SY: "0x0de802e3d6cc9145a150bbdc8da9f988a98c5202",
  YT: "0xe58afaa6e2abf9a9f243d5a55bd5447628c4d811",
  LPs: [
    {
      address: "0x35f3db08a6e9cb4391348b0b404f493e7ae264c0",
      deployedBlock: 211076870,
    },
  ],
  START_BLOCK: 211076870,
  EXPIRY: 1727308800,
  TREASURY: "0x8270400d528c34e1596ef367eedec99080a1b592",
  EQB_STAKING: '0x96db998c5c6c82f6ab3999661a425454ef002202',
  PENPIE_RECEIPT_TOKEN: '0xb3f215afd47dd29f4b82d9b480bb86feaf543e67',

  // STAKEDAO_RECEIPT_TOKEN: "0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a",
  MULTICALL: "0xca11bde05977b3631167028862be2a173976ca11",
  LIQUID_LOCKERS: [
    {
      // Penpie
      address: "0x6db96bbeb081d2a85e0954c252f2c1dc108b3f81",
      receiptToken: "0xb3f215afd47dd29f4b82d9b480bb86feaf543e67",
      lpAddress: "0x35f3db08a6e9cb4391348b0b404f493e7ae264c0",
      deployedBlock: 211800842,
    },
    {
      // EQB
      address: "0x64627901dadb46ed7f275fd4fc87d086cff1e6e3",
      receiptToken: "0x96db998c5c6c82f6ab3999661a425454ef002202",
      lpAddress: "0x35f3db08a6e9cb4391348b0b404f493e7ae264c0",
      deployedBlock: 213150122,
    },
    // {   // STAKEDAO
    //     address: '0xd8fa8dc5adec503acc5e026a98f32ca5c1fa289a',
    //     receiptToken: '0xdd9df6a77b4a4a07875f55ce5cb6b933e52cb30a',
    // }
  ],
};
