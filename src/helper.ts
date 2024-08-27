import { MISC_CONSTS, PENDLE_POOL_ADDRESSES } from "./consts.js";
import os from 'os';
import dotenv from "dotenv"

dotenv.config();

export function isPendleAddress(addr: string) {
    addr = addr.toLowerCase();
    return addr == PENDLE_POOL_ADDRESSES.SY ||
        addr == PENDLE_POOL_ADDRESSES.YT ||
        PENDLE_POOL_ADDRESSES.LPs.some((lpInfo) => lpInfo.address == addr)
}

// @TODO: to modify this when liquid lockers launch
export function isLiquidLockerAddress(addr: string) {
    addr = addr.toLowerCase();
    return PENDLE_POOL_ADDRESSES.LIQUID_LOCKERS.some((liquidLockerInfo) => liquidLockerInfo.address == addr);
}

export function getUnixTimestamp(date: Date) {
    return Math.floor(date.getTime() / 1000);
}

export function isSentioInternalError(err: any): boolean {
    if (
        err.code === os.constants.errno.ECONNRESET ||
        err.code === os.constants.errno.ECONNREFUSED ||
        err.code === os.constants.errno.ECONNABORTED ||
        err.toString().includes('ECONNREFUSED') ||
        err.toString().includes('ECONNRESET') ||
        err.toString().includes('ECONNABORTED')
    ) {
        return true;
    }
    return false;
}

export function addBigInt(a: bigint | string | number, b: bigint | string | number): string {
    return (BigInt(a) + BigInt(b)).toString();
}

export function calcIndexDelta(additionalPoint: bigint, supply: bigint) {
    if (supply == 0n) return 0n;
    return additionalPoint * MISC_CONSTS.ONE_E18 / supply;
}

export function calcPointsFromIndexes(
    oldIndex: bigint,
    newIndex: bigint,
    balance: bigint
) {
    return (newIndex - oldIndex) * balance / MISC_CONSTS.ONE_E18;
}

export function getDbPath(name: string) {
    const env = process.env.MODE || 'production';
    if (env == 'production') {
        return `/data/${name}.db`
    } else {
        return `../../data/${name}-${(new Date()).getTime()}.db`
    }
}