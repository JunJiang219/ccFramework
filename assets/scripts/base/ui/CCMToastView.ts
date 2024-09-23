/**
 * toast view
 */

import { CCMResKeeper } from "../res/CCMResKeeper";
import { tipsMgr } from "./CCMTipsManager";

const TOAST_CACHE_TIME = 0; // 界面默认缓存时间(单位：秒)

// toast参数
export interface CCMIToastOptions {
    text: string;
    duration?: number;
    aniImmediately?: boolean;                   // 开关界面时，动画瞬时完成（即不播动画）

    userOptions?: any;                          // 用户自定义参数
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMToastView extends CCMResKeeper {
    // 缓存时间(单位：秒)
    @property({ type: cc.Integer })
    cacheTime: number = TOAST_CACHE_TIME;

    @property(cc.Label)
    textLabel: cc.Label = null;

    @property(cc.Node)
    textBg: cc.Node = null;

    private static _instCnt: number = 0; // 界面实例计数器

    private _toastId: number = 0; // 界面id
    public get toastId(): number { return this._toastId; }

    private _instId: number = 0; // 界面实例唯一标识符
    public get instId(): number { return this._instId; }

    private _options: CCMIToastOptions = null; // dialog参数
    public get options(): CCMIToastOptions { return this._options; }

    public cachedTS: number = 0;        // 开始缓存的时间戳

    /**
     * 当界面被创建时回调，生命周期内只调用一次(子类复写必须前置调用该父类逻辑)
     * @param toastId 界面id
     * @param options 参数
     */
    public init(toastId: number, options: CCMIToastOptions): void {
        this._toastId = toastId;
        this._instId = ++CCMToastView._instCnt;
        this._options = options;
        if (this.textLabel) this.textLabel.string = options?.text;
    }

    /**
     * 当界面被打开时回调，每次调用 showDialog 时回调
     * @param options 可变参数
     */
    public onOpen(options: CCMIToastOptions): void {
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
}
