/**
 * http请求相关的定义
 */

export const enum URL_PARAM {
    LANGUAGE = "lang",      // 语言
}

// sid类型
export const enum GAME_SID_TYPE {
    DEFAULT = 304,
}

// 登录id类型
export const enum GAME_LID_TYPE {
    FACEBOOK = 3,
    IMEI = 4,
    PHONE = 5,
}

// 渠道号类型
export const enum GAME_CHANNEL_TYPE {
    DEFAULT = 1002,
}

// demo类型
export const enum GAME_DEMO_TYPE {
    FORMAL = 0,         // 正式服
    TEST = 1,           // 测试服
}

export interface Http_FirstGameParam {
    req_number?: string;     // 第几次请求
    imei?: string;           // 设备号
}

// 进正式包第一个请求
export interface Http_FirstBegin {
    game_param?: Http_FirstGameParam;    // 第一次请求参数
    version?: string;                    // 版本号
    sesskey?: string;                    // 会话密钥
    sid?: string;                        // 会话ID
    lid?: string;                        // 登录ID
    channel?: string;                    // 登录ID渠道号
    demo?: string;                       // 登录ID是否为演示版本
    lang?: string;                       // 登录ID语言
}

export interface Http_BaseLoginGameParam {
    sig_sitemid?: string;
    name?: string;
    micon?: string;
    msex?: string;
    tmid?: string;
    imei?: string;
    message?: string;
    google?: string;
    sesskey?: string;
}

// 登录请求
export interface Http_BaseLogin {
    game_param?: Http_BaseLoginGameParam;
    sid?: string;
    lid?: string;
    channel?: string;
    demo?: string;
    version?: string;
}

export const enum HTTP_SUB_URL {
    LOGIN = "script/",
}