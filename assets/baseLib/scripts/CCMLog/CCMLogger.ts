/**
 * 日志打印
 */

import CCMSingleton from "../CCMBase/CCMSingleton";

// 日志等级
export enum CCMLogLevel {
    TRACE,      // 追踪
    DEBUG,      // 调试
    INFO,       // 信息
    WARN,       // 警告
    ERROR,      // 错误
}

const color_trace = "\x1b[36m";      // trace(青色)
const color_debug = "\x1b[32m";      // debug(绿色)
const color_info = "\x1b[34m";       // info(蓝色)
const color_warn = "\x1b[33m";       // warn(黄色)
const color_error = "\x1b[31m";      // error(红色)
const color_reset = "\x1b[0m";       // 后续文本重置样式

export default class CCMLogger extends CCMSingleton {

    private _logLevel: CCMLogLevel = CCMLogLevel.TRACE;
    protected constructor() { super(); }

    // 将数字转换为字符串，并在前面拼接指定数量的零
    private formatNumber(num: number, length: number = 2): string {
        return ('0'.repeat(length) + num).slice(-length);
    }

    // 获取当前日期（2006-01-02 15:04:05.666）
    private getDate() {
        let d = new Date();
        let s = "";
        s = d.getFullYear() + "-"; //取年份
        s = s + this.formatNumber((d.getMonth() + 1)) + "-"; //取月份
        s += this.formatNumber(d.getDate()) + " "; //取日期
        s += this.formatNumber(d.getHours()) + ":"; //取小时
        s += this.formatNumber(d.getMinutes()) + ":"; //取分
        s += this.formatNumber(d.getSeconds()) + "."; //取秒
        s += this.formatNumber(d.getMilliseconds(), 3); //取毫秒
        return s;
    }

    // 设置日志等级
    public setLogLevel(lv: CCMLogLevel) {
        this._logLevel = lv;
    }

    public trace(msg: any, ...subst: any[]) {
        if (this._logLevel > CCMLogLevel.TRACE) return;
        console.trace(`${color_trace}[TRACE][${this.getDate()}]${color_reset}`, msg, ...subst);
    }

    public log(msg: any, ...subst: any[]) {
        if (this._logLevel > CCMLogLevel.DEBUG) return;
        console.log(`${color_debug}[DEBUG][${this.getDate()}]${color_reset}`, msg, ...subst);
    }

    public info(msg: any, ...subst: any[]) {
        if (this._logLevel > CCMLogLevel.INFO) return;
        console.info(`${color_info}[INFO][${this.getDate()}]${color_reset}`, msg, ...subst);
    }

    public warn(msg: any, ...subst: any[]) {
        if (this._logLevel > CCMLogLevel.WARN) return;
        console.warn(`${color_warn}[WARN][${this.getDate()}]${color_reset}`, msg, ...subst);
    }

    public error(msg: any, ...subst: any[]) {
        if (this._logLevel > CCMLogLevel.ERROR) return;
        console.error(`${color_error}[ERROR][${this.getDate()}]${color_reset}`, msg, ...subst);
    }
}