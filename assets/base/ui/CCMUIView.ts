/**
 * 界面基类
 */

import { CCMResKeeper } from "../res/CCMResKeeper";

// 界面展示类型
export enum CCMUIShowType {
    UISingle,       // 单界面显示，显示时会隐藏其他低层级界面（独立界面除外），性能较好
    UIAddition,     // 叠加显示，不影响其他界面低层级界面，性能较差
    UIIndependent,  // 独立显示，不影响其他界面，也不被其他界面影响
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

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMUIView extends CCMResKeeper {

    // 快速关闭
    @property
    quickClose: boolean = false;

    // 缓存选项
    @property
    cache: boolean = false;

    // 界面展示类型
    @property({ type: cc.Enum(CCMUIShowType) })
    showType: CCMUIShowType = CCMUIShowType.UISingle;

    private static _objCnt: number = 0; // 界面实例计数器

    private _uiId: number = 0; // 界面id
    public get uiId(): number { return this._uiId; }

    private _objId: number = 0; // 界面实例唯一标识符
    public get objId(): number { return this._objId; }

    private _layer: CCMUILayers = CCMUILayers.Game; // 界面层级
    public get layer(): CCMUILayers { return this._layer; }

    /**
     * 当界面被创建时回调，生命周期内只调用一次(子类复写必须前置调用该父类逻辑)
     * @param uiId 界面id
     * @param args 可变参数
     */
    public init(uiId: number, ...args: any[]): void {
        this._uiId = uiId;
        this._objId = ++CCMUIView._objCnt;
    }

    /**
     * 当界面被打开时回调，每次调用 open 时回调
     * @param args 可变参数
     */
    public onOpen(...args: any[]): void { }

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
