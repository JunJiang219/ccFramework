/**
 * UIView界面基础类
 * 
 * 1. 快速关闭与屏蔽点击的选项配置
 * 2. 界面缓存设置（开启后界面关闭不会被释放，以便下次快速打开）
 * 3. 界面显示类型配置
 * 
 * 4. 加载资源接口（随界面释放自动释放），this.loadRes(xxx)
 * 5. 由UIManager释放
 * 
 * 5. 界面初始化回调（只调用一次）
 * 6. 界面打开回调（每次打开回调）
 * 7. 界面打开动画播放结束回调（动画播放完回调）
 * 8. 界面关闭回调
 * 9. 界面置顶回调
 * 
 * 2018-8-28 by 宝爷
 */

import { _decorator, CCBoolean, Enum } from "cc";
import { CCMResKeeper } from "../CCMRes/CCMResKeeper";

const { ccclass, property } = _decorator;

// UI显示类型
export enum CCMUIShowType {
    UISingle,           // 单界面显示，其下界面不显示，性能较好
    UIAddition,         // 叠加显示，性能较差
    UIIndependent,      // 独立界面，其显示隐藏不影响其它界面，也不被其它界面影响
}

@ccclass('CCMUIView')
export class CCMUIView extends CCMResKeeper {

    // 快速关闭
    @property(CCBoolean)
    quickClose: boolean = false;

    // 是否缓存
    @property(CCBoolean)
    cache: boolean = false;

    @property({ type: Enum(CCMUIShowType) })
    showType: CCMUIShowType = CCMUIShowType.UISingle;

    private _uiId: number = 0; // 界面id
    public get uiId(): number { return this._uiId; }

    /********************** UI的回调 ***********************/
    /**
     * 当界面被创建时回调，生命周期内只调用
     * @param args 可变参数
     */
    public init(uiId: number, ...args: any[]): void {
        this._uiId = uiId;
    }

    /**
     * 当界面被打开时回调，每次调用Open时回调
     * @param args 可变参数
     */
    public onOpen(...args: any[]): void {}

    /**
     * 每次界面Open动画播放完毕时回调
     */
    public onOpenAniOver(): void {}

    /**
     * 当界面被关闭时回调，每次调用Close时回调
     * 返回值会传递给下一个界面
     */
    public onClose(): any {}

    /**
     * 当界面被置顶时回调，Open时并不会回调该函数
     * @param preId 前一个ui
     * @param args 可变参数
     */
    public onTop(preId: number, ...args: any[]): void {}
}