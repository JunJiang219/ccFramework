/**
 * 界面基类
 */

import { CCMResKeeper } from "../res/CCMResKeeper";
import { ProgressCallback } from "../res/CCMResUtil";
import { CCMIUIInfo } from "./CCMUIManager";

// UI显示类型
export enum CCMUIShowType {
    UISingle,           // 单界面显示，其下界面不显示，性能较好
    UIAddition,         // 叠加显示，性能较差
    UIIndependent,      // 独立界面，其显示隐藏不影响其它界面，也不被其它界面影响
}

const UI_CACHE_TIME = 180; // 界面默认缓存时间(单位：秒)

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMUIView extends CCMResKeeper {

    // 快速关闭
    @property
    quickClose: boolean = false;

    // 缓存时间(单位：秒)
    @property({ type: cc.Integer })
    cacheTime: number = UI_CACHE_TIME;

    private static _instCnt: number = 0; // 界面实例计数器

    private _uiId: number = 0; // 界面id
    public get uiId(): number { return this._uiId; }

    private _instId: number = 0; // 界面实例唯一标识符
    public get instId(): number { return this._instId; }

    public cachedTS: number = 0;        // 开始缓存的时间戳

    /**
     * 预加载资源
     * @param preLoadProgressCb 预加载进度回调
     * @param completeCallback 预加载完成回调
     */
    public preLoadRes(preLoadProgressCb: ProgressCallback | null, completeCallback: () => void): void { completeCallback(); }

    /**
     * 当界面被创建时回调，生命周期内只调用一次(子类复写必须前置调用该父类逻辑)
     * @param uiId 界面id
     * @param args 可变参数
     */
    public init(uiId: number, ...args: any[]): void {
        this._uiId = uiId;
        this._instId = ++CCMUIView._instCnt;
    }

    /**
     * 当界面被打开时回调，每次调用 open 时回调
     * @param fromUIInfo 从哪个UI打开的
     * @param args 可变参数
     */
    public onOpen(fromUIInfo: Readonly<CCMIUIInfo>, ...args: any[]): void { }

    /**
     * 每次界面Open动画播放完毕时回调
     */
    public onOpenAniOver(): void { }

    /**
     * 当界面被关闭时回调，每次调用Close时回调
     * 返回值会传递给下一个界面
     */
    public onClose(): any { }

    /**
     * 当界面被置顶时回调，open 时并不会回调该函数
     * @param preUIInfo 前一个ui
     * @param args 可变参数，
     */
    public onTop(preUIInfo: Readonly<CCMIUIInfo>, ...args: any[]): void { }
}
