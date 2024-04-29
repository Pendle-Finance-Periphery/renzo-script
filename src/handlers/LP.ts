import { AsyncNedb } from "nedb-async";
import {
  getPendleMarketContractOnContext,
} from "../types/eth/pendlemarket.js";
import {
  calcPointsFromHolding,
  updateUserPoint,
} from "../points/point-manager.js";
import {
  addBigInt,
  calcIndexDelta,
  calcPointsFromIndexes,
  getDbPath,
  getUnixTimestamp,
  isLiquidLockerAddress,
} from "../helper.js";
import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from "../consts.js";
import { getERC20ContractOnContext } from "@sentio/sdk/eth/builtin/erc20";
import { EthContext } from "@sentio/sdk/eth";
import {
  getMulticallContractOnContext,
  Multicall2,
} from "../types/eth/multicall.js";
import {
  readAllUserActiveBalances,
  readAllUserERC20Balances,
} from "../multicall.js";
import { EVENT_USER_SHARE, POINT_SOURCE_LP, PointAmounts } from "../types.js";

/**
 * @dev 1 LP = (X PT + Y SY) where X and Y are defined by market conditions
 * So same as Balancer LPT, we need to update all positions on every swap
 *
 * Users can further deposit LP to liquid lockers to get back receipt tokens.
 * This should also be handled here.
 *
 * Currently for all liquid lockers, 1 receipt token = 1 LP
 */

const allDbs = {
  marketGlobalDb: new AsyncNedb({
    filename: getDbPath("market-global"),
    autoload: true,
  }),
  marketAccountDb: new AsyncNedb({
    filename: getDbPath("market-accounts"),
    autoload: true,
  }),
  llGlobalDb: new AsyncNedb({
    filename: getDbPath("ll-global"),
    autoload: true,
  }),
  llAccountDb: new AsyncNedb({
    filename: getDbPath("ll-accounts"),
    autoload: true,
  }),
};

allDbs.marketGlobalDb.persistence.setAutocompactionInterval(60 * 1000);
allDbs.marketAccountDb.persistence.setAutocompactionInterval(60 * 1000);
allDbs.llGlobalDb.persistence.setAutocompactionInterval(60 * 1000);
allDbs.llAccountDb.persistence.setAutocompactionInterval(60 * 1000);

type MarketGlobalData = {
  _id: string;
  lastTotalSy: string;
  lastTotalActiveSupply: string;
  lastUpdatedAt: number;
  globalIndexEz: string;
  globalIndexEl: string;
};

type MarketAccount = {
  _id: string;
  accountIndexEz: string;
  accountIndexEl: string;
  lastActiveBalance: string;
};

type LiquidLockerGlobData = {
  _id: string;
  llIndexEz: string;
  llIndexEl: string;
  lastTotalSupply: string;
};

type LiquidLockerAccount = {
  _id: string;
  accountIndexEz: string;
  accountIndexEl: string;
  lastBalance: string;
};

export async function updateAllLPAccounts(ctx: EthContext) {
  await updateGlobalPoint(ctx);
  {
    const allMarketAccounts = await allDbs.marketAccountDb.asyncFind<MarketAccount>({});
    const allAccounts = allMarketAccounts.map((v) => v._id.split("-")[1]);
    
    // Should not do concurrent here...

    for(const lpInfo of PENDLE_POOL_ADDRESSES.LPs) {
      if (lpInfo.deployedBlock > ctx.blockNumber) continue;
      const allActiveBalances = await readAllUserActiveBalances(ctx, lpInfo.address, allAccounts);
      for (let i = 0; i < allAccounts.length; ++i) {
        await updateMarketAccount(ctx, lpInfo.address, allAccounts[i], allActiveBalances[i]);
      }
    }
  }

  {
    const allLLAccounts = await allDbs.llAccountDb.asyncFind<LiquidLockerAccount>({});
    const allAccounts = allLLAccounts.map((v) => v._id.split("-")[1]);

    for(const llInfo of PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS) {
      if (llInfo.deployedBlock > ctx.blockNumber) continue;
      const allBalances = await readAllUserERC20Balances(ctx, allAccounts, llInfo.receiptToken);
      for (let i = 0; i < allAccounts.length; ++i) {
        await updateLiquidLockerAccount(ctx, allAccounts[i], llInfo.receiptToken, allBalances[i]);
      }
    }
  }
}

export async function handleMarketAccounts(ctx: EthContext, market: string, accounts: string[]) {
  market = market.toLowerCase();
  accounts = accounts.map((v) => v.toLowerCase());
  const activeBalances = await readAllUserActiveBalances(ctx, market, accounts);
  await updateGlobalPoint(ctx);
  for (let i = 0; i < accounts.length; ++i) {
    await updateMarketAccount(ctx, market, accounts[i], activeBalances[i]);
  }
}

export async function handleLiquidLockerAccounts(ctx: EthContext, receiptToken: string, accounts: string[]) {
  receiptToken = receiptToken.toLowerCase();
  accounts = accounts.map((v) => v.toLowerCase());

  const ll = PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS.find((v) => v.receiptToken == receiptToken)!;
  const market = getPendleMarketContractOnContext(ctx, ll.lpAddress);

  const llActiveBalance = await market.activeBalance(ll.address);
  await updateGlobalPoint(ctx);
  await updateMarketAccount(ctx, ll.lpAddress, ll.address, llActiveBalance);

  const userBalances = await readAllUserERC20Balances(ctx, accounts, receiptToken);
  for(let i = 0; i < accounts.length; ++i) {
    await updateLiquidLockerAccount(ctx, accounts[i], receiptToken, userBalances[i]);
  }
}

export async function updateGlobalPoint(ctx: EthContext) {
  const timestamp = getUnixTimestamp(ctx.timestamp);
  const metaDatas = await fetchMarketData(ctx);

  for (let i = 0; i < metaDatas.length; ++i) {
    let globData = await allDbs.marketGlobalDb.asyncFindOne<MarketGlobalData>({
      _id: PENDLE_POOL_ADDRESSES.LPs[i].address,
    });
    if (globData && globData.lastUpdatedAt == timestamp) continue;

    if (!globData) {
      globData = {
        _id: PENDLE_POOL_ADDRESSES.LPs[i].address,
        lastTotalSy: metaDatas[i].totalSy.toString(),
        lastTotalActiveSupply: metaDatas[i].totalActiveSupply.toString(),
        lastUpdatedAt: timestamp,
        globalIndexEl: "0",
        globalIndexEz: "0",
      };
    } else {
      const accruedPoints = calcPointsFromHolding(
        ctx,
        BigInt(globData.lastTotalSy),
        BigInt(timestamp - globData.lastUpdatedAt)
      );

      const lastTotalActiveSupply = BigInt(globData.lastTotalActiveSupply);

      globData = {
        _id: PENDLE_POOL_ADDRESSES.LPs[i].address,
        lastTotalSy: metaDatas[i].totalSy.toString(),
        lastTotalActiveSupply: metaDatas[i].totalActiveSupply.toString(),
        lastUpdatedAt: timestamp,
        globalIndexEz: addBigInt(
          globData.globalIndexEz,
          calcIndexDelta(accruedPoints.ezPoint, lastTotalActiveSupply)
        ),
        globalIndexEl: addBigInt(
          globData.globalIndexEl,
          calcIndexDelta(accruedPoints.elPoint, lastTotalActiveSupply)
        ),
      };

    }
    await allDbs.marketGlobalDb.asyncUpdate(
      { _id: PENDLE_POOL_ADDRESSES.LPs[i].address },
      globData,
      { upsert: true }
    );
  }
}

async function updateLiquidLockerAccount(
  ctx: EthContext,
  account: string,
  receiptToken: string,
  accountBalance: bigint
): Promise<void> {
  if (account == MISC_CONSTS.ZERO_ADDRESS) return;

  const globData = await allDbs.llGlobalDb.asyncFindOne<LiquidLockerGlobData>({ _id: receiptToken });
  const _id = `${receiptToken}-${account}`;
  let accountData = await allDbs.llAccountDb.asyncFindOne<LiquidLockerAccount>({ _id });

  if (!accountData) {
    accountData = {
      _id,
      accountIndexEl: globData.llIndexEl,
      accountIndexEz: globData.llIndexEz,
      lastBalance: accountBalance.toString(),
    };
  } else {
    const ezPoint = calcPointsFromIndexes(
      BigInt(accountData.accountIndexEz),
      BigInt(globData.llIndexEz),
      BigInt(accountData.lastBalance)
    );
    const elPoint = calcPointsFromIndexes(
      BigInt(accountData.accountIndexEl),
      BigInt(globData.llIndexEl),
      BigInt(accountData.lastBalance)
    );

    await updateUserPoint(account, POINT_SOURCE_LP, { ezPoint, elPoint });

    accountData = {
      _id,
      accountIndexEz: globData.llIndexEz,
      accountIndexEl: globData.llIndexEl,
      lastBalance: accountBalance.toString(),
    };
  }

  await allDbs.llAccountDb.asyncUpdate({ _id }, accountData, { upsert: true });
}

async function updateMarketAccount(
  ctx: EthContext,
  market: string,
  account: string,
  newActiveBalance: bigint
) {
  if (account == MISC_CONSTS.ZERO_ADDRESS) return;
  const globData = await allDbs.marketGlobalDb.asyncFindOne<MarketGlobalData>({
    _id: market,
  });
  if (!globData) {
    throw new Error("Global data not found")
    return;
  }

  const _id = `${market}-${account}`;
  let accountData = await allDbs.marketAccountDb.asyncFindOne<MarketAccount>({
    _id,
  });

  if (!accountData) {
    accountData = {
      _id,
      accountIndexEl: globData.globalIndexEl,
      accountIndexEz: globData.globalIndexEz,
      lastActiveBalance: newActiveBalance.toString(),
    };
  } else {
    const ezPoint = calcPointsFromIndexes(
      BigInt(accountData.accountIndexEz),
      BigInt(globData.globalIndexEz),
      BigInt(accountData.lastActiveBalance)
    );

    const elPoint = calcPointsFromIndexes(
      BigInt(accountData.accountIndexEl),
      BigInt(globData.globalIndexEl),
      BigInt(accountData.lastActiveBalance)
    );

    const points: PointAmounts = {
      ezPoint,
      elPoint,
    };

    if (isLiquidLockerAddress(account)) {
      const ll = PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS.find(
        (v) => v.address == account && v.lpAddress == market
      )!;
      await updateLiquidLocker(ctx, ll.receiptToken, points);
    } else {
      await updateUserPoint(account, POINT_SOURCE_LP, points);
    }

    accountData = {
      _id,
      accountIndexEz: globData.globalIndexEz,
      accountIndexEl: globData.globalIndexEl,
      lastActiveBalance: newActiveBalance.toString(),
    };
  }
  await allDbs.marketAccountDb.asyncUpdate({ _id }, accountData, {
    upsert: true,
  });
}

async function updateLiquidLocker(
  ctx: EthContext,
  receiptToken: string,
  points: PointAmounts
) {
  const token = getERC20ContractOnContext(ctx, receiptToken);
  const supply = await token.totalSupply();
  let llGlobData = await allDbs.llGlobalDb.asyncFindOne<LiquidLockerGlobData>({
    _id: receiptToken,
  });
  if (!llGlobData) {
    if (points.ezPoint > 0n) {
      throw new Error("What the actual f???")
    }
    llGlobData = {
      _id: receiptToken,
      llIndexEz: "0",
      llIndexEl: "0",
      lastTotalSupply: supply.toString(),
    };
  } else {
    llGlobData.llIndexEz = addBigInt(
      llGlobData.llIndexEz,
      calcIndexDelta(points.ezPoint, BigInt(llGlobData.lastTotalSupply))
    );
    llGlobData.llIndexEl = addBigInt(
      llGlobData.llIndexEl,
      calcIndexDelta(points.elPoint, BigInt(llGlobData.lastTotalSupply))
    );
    llGlobData.lastTotalSupply = supply.toString();
  }

  await allDbs.llGlobalDb.asyncUpdate({ _id: receiptToken }, llGlobData, {
    upsert: true,
  });
}

async function fetchMarketData(ctx: EthContext) {
  const allCalls: Multicall2.CallStruct[] = [];

  for (let marketInfo of PENDLE_POOL_ADDRESSES.LPs) {
    if (ctx.blockNumber < marketInfo.deployedBlock) continue;

    const market = getPendleMarketContractOnContext(ctx, marketInfo.address);
    allCalls.push({
      target: market.address,
      callData: market.rawContract.interface.encodeFunctionData("readState", [
        market.address,
      ]),
    });
    allCalls.push({
      target: market.address,
      callData: market.rawContract.interface.encodeFunctionData(
        "totalActiveSupply",
        []
      ),
    });
  }

  const multicall = getMulticallContractOnContext(
    ctx,
    PENDLE_POOL_ADDRESSES.MULTICALL
  );
  const results = await multicall.callStatic.tryAggregate(true, allCalls);

  const rtnData = [
    {
      totalSy: 0n,
      totalActiveSupply: 0n,
    },
    {
      totalSy: 0n,
      totalActiveSupply: 0n,
    },
  ];

  for (let i = 0; i * 2 < results.length; ++i) {
    const market = getPendleMarketContractOnContext(
      ctx,
      PENDLE_POOL_ADDRESSES.LPs[i].address
    );
    const state = market.rawContract.interface.decodeFunctionResult(
      "readState",
      results[i * 2].returnData
    )[0];
    const totalActiveSupply = market.rawContract.interface.decodeFunctionResult(
      "totalActiveSupply",
      results[i * 2 + 1].returnData
    )[0];
    rtnData[i] = {
      totalSy: state.totalSy,
      totalActiveSupply,
    };
  }

  return rtnData;
}
