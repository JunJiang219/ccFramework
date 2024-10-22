/**
 * toast view
 */

import { tipsMgr } from "./CCMTipsManager";
import { CCMIUIArgs, CCMIUIInfo } from "./CCMUIManager";
import CCMUIView from "./CCMUIView";

const TOAST_CACHE_TIME = 0; // 界面默认缓存时间(单位：秒)

// toast参数
export interface CCMIToastOptions extends CCMIUIArgs {
    text: string;
    duration?: number;

    userOptions?: any;                          // 用户自定义参数
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMToastView extends CCMUIView {
    // 缓存时间(单位：秒)
    @property({ type: cc.Integer, override: true })
    cacheTime: number = TOAST_CACHE_TIME;

    @property(cc.Label)
    textLabel: cc.Label = null;

    @property(cc.Node)
    textBg: cc.Node = null;

    protected _options: CCMIToastOptions = null; // toast参数
    public get options(): CCMIToastOptions { return this._options; }

    public cachedTS: number = 0;        // 开始缓存的时间戳

    /**
     * 当界面被创建时回调，生命周期内只调用一次(子类复写必须前置调用该父类逻辑)
     * @param uiId 界面id
     * @param options 参数
     */
    public init(uiId: number, options: CCMIToastOptions): void {
        super.init(uiId, options);

        this._options = options;
        if (this.textLabel) this.textLabel.string = options?.text;
    }

    /**
     * 当界面被打开时回调，每次调用 showToast 时回调
     * @param fromUIInfo 从哪个UI打开的
     * @param options 可变参数
     */
    public onOpen(fromUIInfo: Readonly<CCMIUIInfo>, options: CCMIToastOptions): void {
        if (this.textBg && this.textLabel) {
            let textSize = this.textLabel.node.getContentSize();
            this.textBg.setContentSize(textSize.width + 10, textSize.height + 10);
        }
    }

    /**
     * 每次界面Open动画播放完毕时回调
     */
    public onOpenAniOver(): void {
        this.scheduleOnce(() => {
            tipsMgr.closeToast(this);
        }, this._options.duration || 3);
    }

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
