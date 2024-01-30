import { PENDLE_POOL_ADDRESSES } from "./consts.js";

export function isPendleAddress(addr: string) {
    return addr == PENDLE_POOL_ADDRESSES.SY ||
        addr == PENDLE_POOL_ADDRESSES.YT ||
        addr == PENDLE_POOL_ADDRESSES.LP;
}

// @TODO: to modify this when liquid lockers launch
export function isLiquidLockerAddress(addr: string) {
    return false; 
}

export function getUnixTimestamp(date: Date) {
    return Math.floor(date.getTime() / 1000);
}