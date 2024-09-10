/**
 *  时间工具类
 */

export default class CCMTimeUtil {

    private static _instance: CCMTimeUtil;
    private constructor() { }
    public static get inst(): CCMTimeUtil {
        if (!CCMTimeUtil._instance) {
            CCMTimeUtil._instance = new CCMTimeUtil();
        }
        return CCMTimeUtil._instance;
    }

    // 时间差值(毫秒, server - local)
    private _diffTime: number = 0;
    public get diffTime(): number {
        return this._diffTime;
    }

    // 同步服务器时间
    public syncServerTime(serverTime: number): void {
        this._diffTime = serverTime - this.localNow();
    }

    // 获取本地当前时间戳(毫秒)
    public localNow(): number {
        return Date.now();
    }

    // 获取服务器当前时间戳(毫秒)
    public serverNow(): number {
        return Date.now() + this._diffTime;
    }
}

export const timeUtil = CCMTimeUtil.inst;