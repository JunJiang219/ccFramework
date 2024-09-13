/**
 * 界面基类
 */

import { CCMResKeeper } from "../res/CCMResKeeper";

// 界面展示类型
export enum CCMUIShowType {
    UISingle,       // 单界面显示，显示时会隐藏其他低层级界面（独立界面除外），性能较好
    UIAddition,     // 叠加显示，不影响其他界面低层级界面，性能较差
    UIIndependent,  // 独立显示，不影响其他界面，也不被其他界面影响，少用
}

// 界面层级
export enum CCMUILayers {
    Game,           // 游戏界面层级
    Popup,          // 弹窗层级
    Notice,         // 提示层级
    Loading,        // 加载层级
    Top,            // 置顶层级
    Num,            // 层级数量
}

// 界面动画名称
export enum CCMUIAniName {
    UIOpen = "uiOpen",          // 界面打开动画
    UIClose = "uiClose",        // 界面关闭动画
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

    // 界面展示类型
    @property({ type: cc.Enum(CCMUIShowType) })
    showType: CCMUIShowType = CCMUIShowType.UISingle;

    private static _instCnt: number = 0; // 界面实例计数器

    private _uiId: number = 0; // 界面id
    public get uiId(): number { return this._uiId; }

    private _instId: number = 0; // 界面实例唯一标识符
    public get instId(): number { return this._instId; }

    private _layer: CCMUILayers = CCMUILayers.Game; // 界面层级
    public get layer(): CCMUILayers { return this._layer; }

    public isOpening: boolean = false;  // 是否正在打开
    public isClosing: boolean = false;  // 是否正在关闭
    public cachedTS: number = 0;        // 开始缓存时间戳

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
     * @param fromUI 从哪个UI打开的
     * @param args 可变参数
     */
    public onOpen(fromUI: CCMUIView, ...args: any[]): void { }

    // 界面打开动画
    public execOpenAni(finishCb: (...args: any[]) => void) { finishCb(); }

    // 界面关闭动画
    public execCloseAni(finishCb: (...args: any[]) => void) { finishCb(); }

    /**
     * 当界面被关闭时回调，每次调用Close时回调
     * 返回值会传递给下一个界面
     */
    public onClose(): any { }

    /**
     * 当界面被置顶时回调，open 时并不会回调该函数
     * @param preUI 前一个ui
     * @param args 可变参数，
     */
    public onTop(preUIView: CCMUIView, ...args: any[]): void { }
}
