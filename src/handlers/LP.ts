import { AsyncNedb } from "nedb-async";
import { getPendleMarketContractOnContext } from "../types/eth/pendlemarket.ts";
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
  Multicall3,
} from "../types/eth/multicall.js";
import {
  readAllUserActiveBalances,
  readAllUserERC20Balances,
} from "../multicall.js";
import {
  EVENT_USER_SHARE,
  POINT_SOURCE_LP,
  PointAmounts,
  UPDATE_TYPE_LIQUID_LOCKER_INFO,
  UPDATE_TYPE_MARKET_INFO,
  UPDATE_TYPE_USER_LIQUID_LOCKER_INFO,
  UPDATE_TYPE_USER_MARKET_INFO,
} from "../types.js";

import {
  MarketGlobalData,
  MarketAccount,
  LiquidLockerAccount,
  LiquidLockerGlobData,
} from "../schema/schema.ts";

/**
 * @dev 1 LP = (X PT + Y SY) where X and Y are defined by market conditions
 * So same as Balancer LPT, we need to update all positions on every swap
 *
 * Users can further deposit LP to liquid lockers to get back receipt tokens.
 * This should also be handled here.
 *
 * Currently for all liquid lockers, 1 receipt token = 1 LP
 */

// const allDbs = {
//   marketGlobalDb: new AsyncNedb({
//     filename: getDbPath("market-global"),
//     autoload: true,
//   }),
//   marketAccountDb: new AsyncNedb({
//     filename: getDbPath("market-accounts"),
//     autoload: true,
//   }),
//   llGlobalDb: new AsyncNedb({
//     filename: getDbPath("ll-global"),
//     autoload: true,
//   }),
//   llAccountDb: new AsyncNedb({
//     filename: getDbPath("ll-accounts"),
//     autoload: true,
//   }),
// };

// allDbs.marketGlobalDb.persistence.setAutocompactionInterval(60 * 1000);
// allDbs.marketAccountDb.persistence.setAutocompactionInterval(60 * 1000);
// allDbs.llGlobalDb.persistence.setAutocompactionInterval(60 * 1000);
// allDbs.llAccountDb.persistence.setAutocompactionInterval(60 * 1000);

// type MarketGlobalData = {
//   id: string;
//   lastTotalSy: string;
//   lastTotalActiveSupply: string;
//   lastUpdatedAt: number;
//   globalIndexEz: string;
//   globalIndexEl: string;
// };

// type MarketAccount = {
//   id: string;
//   accountIndexEz: string;
//   accountIndexEl: string;
//   lastActiveBalance: string;
// };

// type LiquidLockerGlobData = {
//   id: string;
//   llIndexEz: string;
//   llIndexEl: string;
//   lastTotalSupply: string;
// };

// type LiquidLockerAccount = {
//   id: string;
//   accountIndexEz: string;
//   accountIndexEl: string;
//   lastBalance: string;
// };

export async function updateAllLPAccounts(ctx: EthContext) {
  await updateGlobalPoint(ctx);
  {
    // const allMarketAccounts = await allDbs.marketAccountDb.asyncFind<MarketAccount>({});

    const allMarketAccounts = await ctx.store.list(MarketAccount, []);

    const allAccounts = allMarketAccounts.map(
      (v) => (v.id.toString().toLowerCase()).split("-")[1]
    );

    // Should not do concurrent here...

    for (const lpInfo of PENDLE_POOL_ADDRESSES.LPs) {
      if (lpInfo.deployedBlock > ctx.blockNumber) continue;
      const allActiveBalances = await readAllUserActiveBalances(
        ctx,
        lpInfo.address,
        allAccounts
      );
      for (let i = 0; i < allAccounts.length; ++i) {
        await updateMarketAccount(
          ctx,
          lpInfo.address,
          allAccounts[i],
          allActiveBalances[i]
        );
      }
    }
  }

  {
    // const allLLAccounts = await allDbs.llAccountDb.asyncFind<LiquidLockerAccount>({});
    const allLLAccounts = await ctx.store.list(LiquidLockerAccount, []);
    const allAccounts = allLLAccounts.map(
      (v) => (v.id.toString().toLowerCase()).split("-")[1]
    );

    for (const llInfo of PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS) {
      if (llInfo.deployedBlock > ctx.blockNumber) continue;
      const allBalances = await readAllUserERC20Balances(
        ctx,
        allAccounts,
        llInfo.receiptToken
      );

      const sumAllBalances = allBalances.reduce((acc, v) => acc + Number(v), 0);
      if (sumAllBalances == 0) continue;

      for (let i = 0; i < allAccounts.length; ++i) {
        await updateLiquidLockerAccount(
          ctx,
          allAccounts[i],
          llInfo.receiptToken,
          allBalances[i]
        );
      }
    }
  }
}

export async function handleMarketAccounts(
  ctx: EthContext,
  market: string,
  accounts: string[]
) {
  market = market.toLowerCase();
  accounts = accounts.map((v) => v.toLowerCase());
  const activeBalances = await readAllUserActiveBalances(ctx, market, accounts);
  await updateGlobalPoint(ctx);
  for (let i = 0; i < accounts.length; ++i) {
    await updateMarketAccount(ctx, market, accounts[i], activeBalances[i]);
  }
}

export async function handleLiquidLockerAccounts(
  ctx: EthContext,
  receiptToken: string,
  accounts: string[]
) {
  receiptToken = receiptToken.toLowerCase();
  accounts = accounts.map((v) => v.toLowerCase());

  const ll = PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS.find(
    (v) => v.receiptToken == receiptToken
  )!;
  const market = getPendleMarketContractOnContext(ctx, ll.lpAddress);

  const llActiveBalance = await market.activeBalance(ll.address);
  await updateGlobalPoint(ctx);

  await updateMarketAccount(ctx, ll.lpAddress, ll.address, llActiveBalance);

  const userBalances = await readAllUserERC20Balances(
    ctx,
    accounts,
    receiptToken
  );
  for (let i = 0; i < accounts.length; ++i) {
    await updateLiquidLockerAccount(
      ctx,
      accounts[i],
      receiptToken,
      userBalances[i]
    );
  }
}

export async function updateGlobalPoint(ctx: EthContext) {
  const timestamp = getUnixTimestamp(ctx.timestamp);
  const metaDatas = await fetchMarketData(ctx);

  for (let i = 0; i < metaDatas.length; ++i) {
    // let globData = await allDbs.marketGlobalDb.asyncFindOne<MarketGlobalData>({
    //   id: PENDLE_POOL_ADDRESSES.LPs[i].address,
    // });

    let globData = await ctx.store.get(
      MarketGlobalData,
      PENDLE_POOL_ADDRESSES.LPs[i].address
    );

    if (globData && globData.lastUpdatedAt == timestamp) continue;

    if (!globData) {
      globData = new MarketGlobalData({
        id: PENDLE_POOL_ADDRESSES.LPs[i].address,
        lastTotalSy: metaDatas[i].totalSy,
        lastTotalActiveSupply: metaDatas[i].totalActiveSupply,
        lastUpdatedAt: timestamp,
        globalIndexEl: 0n,
        globalIndexEz: 0n,
      });
    } else {
      const accruedPoints = calcPointsFromHolding(
        ctx,
        BigInt(globData.lastTotalSy),
        BigInt(timestamp - globData.lastUpdatedAt)
      );

      const lastTotalActiveSupply = BigInt(globData.lastTotalActiveSupply);

      globData = new MarketGlobalData({
        id: PENDLE_POOL_ADDRESSES.LPs[i].address,
        lastTotalSy: metaDatas[i].totalSy,
        lastTotalActiveSupply: metaDatas[i].totalActiveSupply,
        lastUpdatedAt: timestamp,
        globalIndexEz: addBigInt(
          globData.globalIndexEz,
          calcIndexDelta(accruedPoints.ezPoint, lastTotalActiveSupply)
        ),
        globalIndexEl: addBigInt(
          globData.globalIndexEl,
          calcIndexDelta(accruedPoints.elPoint, lastTotalActiveSupply)
        ),
      });
    }

    ctx.eventLogger.emit(UPDATE_TYPE_MARKET_INFO, {
      market: PENDLE_POOL_ADDRESSES.LPs[i].address,
      ...metaDatas[i],
    });

    await ctx.store.upsert(globData);

    // await allDbs.marketGlobalDb.asyncUpdate(
    //   { id: PENDLE_POOL_ADDRESSES.LPs[i].address },
    //   globData,
    //   { upsert: true }
    // );
  }
}

async function updateLiquidLockerAccount(
  ctx: EthContext,
  account: string,
  receiptToken: string,
  accountBalance: bigint
): Promise<void> {
  if (account == MISC_CONSTS.ZERO_ADDRESS) return;

  // const globData = await allDbs.llGlobalDb.asyncFindOne<LiquidLockerGlobData>({ id: receiptToken });

  const globData = await ctx.store.get(LiquidLockerGlobData, receiptToken);

  if (!globData) {
    return;
  }

  const id = `${receiptToken}-${account}`;
  // let accountData = await allDbs.llAccountDb.asyncFindOne<LiquidLockerAccount>({ id });
  let accountData = await ctx.store.get(LiquidLockerAccount, id);

  if (!accountData) {
    accountData = new LiquidLockerAccount({
      id,
      accountIndexEl: globData.llIndexEl,
      accountIndexEz: globData.llIndexEz,
      lastBalance: accountBalance,
    });
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

    await updateUserPoint(ctx, account, POINT_SOURCE_LP, { ezPoint, elPoint });

    accountData = new LiquidLockerAccount({
      id,
      accountIndexEz: globData.llIndexEz,
      accountIndexEl: globData.llIndexEl,
      lastBalance: accountBalance,
    });
  }

  ctx.eventLogger.emit(UPDATE_TYPE_USER_LIQUID_LOCKER_INFO, {
    user: account,
    receiptToken,
    balance: accountBalance,
  });

  // await allDbs.llAccountDb.asyncUpdate({ id }, accountData, { upsert: true });
  await ctx.store.upsert(accountData);
}

async function updateMarketAccount(
  ctx: EthContext,
  market: string,
  account: string,
  newActiveBalance: bigint
) {
  if (account == MISC_CONSTS.ZERO_ADDRESS) return;
  // const globData = await allDbs.marketGlobalDb.asyncFindOne<MarketGlobalData>({
  //   id: market,
  // });
  const globData = await ctx.store.get(MarketGlobalData, market);
  if (!globData) {
    throw new Error("Global data not found");
    return;
  }

  const id = `${market}-${account}`;
  // let accountData = await allDbs.marketAccountDb.asyncFindOne<MarketAccount>({
  //   id,
  // });
  let accountData = await ctx.store.get(MarketAccount, id);

  if (!accountData) {
    accountData = new MarketAccount({
      id,
      accountIndexEl: globData.globalIndexEl,
      accountIndexEz: globData.globalIndexEz,
      lastActiveBalance: newActiveBalance,
    });
    if (isLiquidLockerAddress(account)) {
      const ll = PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS.find(
        (v) => v.address == account && v.lpAddress == market
      )!;
      await updateLiquidLocker(
        ctx,
        ll.receiptToken,
        { ezPoint: 0n, elPoint: 0n },
        newActiveBalance
      );
    }
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
      await updateLiquidLocker(ctx, ll.receiptToken, points, newActiveBalance);
    } else {
      await updateUserPoint(ctx, account, POINT_SOURCE_LP, points);
      ctx.eventLogger.emit(UPDATE_TYPE_USER_MARKET_INFO, {
        user: account,
        activeBalance: newActiveBalance,
        market,
      });
    }

    accountData = new MarketAccount({
      id,
      accountIndexEz: globData.globalIndexEz,
      accountIndexEl: globData.globalIndexEl,
      lastActiveBalance: newActiveBalance,
    });
  }
  // await allDbs.marketAccountDb.asyncUpdate({ id }, accountData, {
  //   upsert: true,
  // });
  await ctx.store.upsert(accountData);
}

async function updateLiquidLocker(
  ctx: EthContext,
  receiptToken: string,
  points: PointAmounts,
  newActiveBalance: bigint
) {
  const ll = PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS.find(
    (v) => v.receiptToken == receiptToken
  )!;

  if (ll.deployedBlock > ctx.blockNumber) return;

  const token = getERC20ContractOnContext(ctx, receiptToken);
  let supply = 0n;
  try {
    supply = await token.totalSupply();
  } catch (e) {
    throw new Error(
      `Failed to get total supply of receipt token ${receiptToken} ${ctx.blockNumber} ${points.ezPoint}`
    );
    // console.error("Failed to get total supply of receipt token", e, receiptToken, ctx.blockNumber);
  }

  // let llGlobData = await allDbs.llGlobalDb.asyncFindOne<LiquidLockerGlobData>({
  //   id: receiptToken,
  // });
  let llGlobData = await ctx.store.get(LiquidLockerGlobData, receiptToken);
  if (!llGlobData) {
    if (points.ezPoint > 0n) {
      throw new Error(
        "Invalid state llGlobData not found but points.ezPoint > 0"
      );
    }
    llGlobData = new LiquidLockerGlobData({
      id: receiptToken,
      llIndexEz: 0n,
      llIndexEl: 0n,
      lastTotalSupply: supply,
    });
  } else {
    llGlobData.llIndexEz = addBigInt(
      llGlobData.llIndexEz,
      calcIndexDelta(points.ezPoint, BigInt(llGlobData.lastTotalSupply))
    );
    llGlobData.llIndexEl = addBigInt(
      llGlobData.llIndexEl,
      calcIndexDelta(points.elPoint, BigInt(llGlobData.lastTotalSupply))
    );
    llGlobData.lastTotalSupply = supply;
  }

  ctx.eventLogger.emit(UPDATE_TYPE_LIQUID_LOCKER_INFO, {
    liquidLockerReceiptToken: receiptToken,
    totalSupply: supply,
    market: ll.lpAddress,
    activeBalance: newActiveBalance,
  });

  // await allDbs.llGlobalDb.asyncUpdate({ id: receiptToken }, llGlobData, {
  //   upsert: true,
  // });
  await ctx.store.upsert(llGlobData);
}

async function fetchMarketData(ctx: EthContext) {
  const allCalls: Multicall3.CallStruct[] = [];

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

  const rtnData = new Array<{
    totalSy: bigint;
    totalActiveSupply: bigint;
  }>(PENDLE_POOL_ADDRESSES.LPs.length).fill({
    totalSy: 0n,
    totalActiveSupply: 0n,
  });

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
