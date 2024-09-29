import { HeartData, MSG2, UserLogin } from "../proto/BuffProto";

export const enum WS_CMD {
    /**--------------------------- 客户端消息 -------------------------------------- */
    CLIENT_LOGIN = 0x0101,              // 登录
    CLIENT_HEART_BEAT = 0x0120,         // 心跳包
    /**--------------------------- 客户端消息 -------------------------------------- */

    /**--------------------------- 服务器消息 -------------------------------------- */
    SERVER_HEART_BEAT = 0x0120,         // 心跳包
    SERVER_LOGIN_SUCCESS = 0x0201,      // 登录成功
    SERVER_SINGLE_BROADCAST = 0x7052,   // 单播消息
    SERVER_BROADCAST = 0x7056,          // 全服广播（跑马灯）
    /**--------------------------- 服务器消息 -------------------------------------- */
}

export const WS_CMD_CLASS = {
    [WS_CMD.CLIENT_LOGIN]: UserLogin,
    [WS_CMD.CLIENT_HEART_BEAT]: HeartData,      // 心跳包(SERVER_HEART_BEAT 相同)

    [WS_CMD.SERVER_LOGIN_SUCCESS]: UserLogin,   // 登录成功
    [WS_CMD.SERVER_SINGLE_BROADCAST]: MSG2,     // 单播消息
    [WS_CMD.SERVER_BROADCAST]: MSG2,            // 全服广播（跑马灯）
}