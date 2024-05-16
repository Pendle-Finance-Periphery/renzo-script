export type EVENT_TYPE = "point_increase" | "user_share"
export const EVENT_POINT_INCREASE: EVENT_TYPE = "point_increase"
export const EVENT_USER_SHARE: EVENT_TYPE = "user_share"

export type POINT_SOURCE = "YT" | "LP" | "SY"
export const POINT_SOURCE_YT: POINT_SOURCE = "YT"
export const POINT_SOURCE_LP: POINT_SOURCE = "LP"
export const POINT_SOURCE_SY: POINT_SOURCE = "SY"

export type UPDATE_TYPE = "market_info" | "liquid_locker_info" | "user_market_info" | "user_liquid_locker_info" | "user_yt_position"
export const UPDATE_TYPE_MARKET_INFO: UPDATE_TYPE = "market_info"
export const UPDATE_TYPE_LIQUID_LOCKER_INFO: UPDATE_TYPE = "liquid_locker_info"
export const UPDATE_TYPE_USER_MARKET_INFO: UPDATE_TYPE = "user_market_info"
export const UPDATE_TYPE_USER_LIQUID_LOCKER_INFO: UPDATE_TYPE = "user_liquid_locker_info"
export const UPDATE_TYPE_USER_YT_POSITION: UPDATE_TYPE = "user_yt_position"

export type PointAmounts = {
    ezPoint: bigint
    elPoint: bigint
}