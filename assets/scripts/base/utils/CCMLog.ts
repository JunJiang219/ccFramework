/**
 * 日志打印
 */

// 日志等级
export enum CCMLogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
    NONE
}

if (CC_DEBUG) {
    window['CCMLogLv'] = CCMLogLevel.DEBUG;
} else {
    window['CCMLogLv'] = CCMLogLevel.ERROR;
}

export default class CCMLog {

    private static _instance: CCMLog = null;
    private constructor() { }
    public static get inst(): CCMLog {
        if (CCMLog._instance == null) {
            CCMLog._instance = new CCMLog();
        }
        return CCMLog._instance;
    }

    private _getDate() {
        let d = new Date();
        let s = "";
        s = d.getFullYear() + "-"; //取年份
        s = s + (d.getMonth() + 1) + "-"; //取月份
        s += d.getDate() + " "; //取日期
        s += d.getHours() + ":"; //取小时
        s += d.getMinutes() + ":"; //取分
        s += d.getSeconds(); //取秒
        s += d.getMilliseconds(); //取毫秒
        return s;
    }

    public log(msg: string | any, ...subst: any[]) {
        if (window['CCMLogLv'] > CCMLogLevel.DEBUG) return;
        cc.log(`[DEBUG][${this._getDate()}]`, msg, ...subst);
    }

    public info(msg: string | any, ...subst: any[]) {
        if (window['CCMLogLv'] > CCMLogLevel.INFO) return;
        cc.log(`[INFO][${this._getDate()}]`, msg, ...subst);
    }

    public warn(msg: string | any, ...subst: any[]) {
        if (window['CCMLogLv'] > CCMLogLevel.WARN) return;
        cc.warn(`[WARN][${this._getDate()}]`, msg, ...subst);
    }

    public error(msg: string | any, ...subst: any[]) {
        if (window['CCMLogLv'] > CCMLogLevel.ERROR) return;
        cc.error(`[ERROR][${this._getDate()}]`, msg, ...subst);
    }
}

export const ccmLog = CCMLog.inst;