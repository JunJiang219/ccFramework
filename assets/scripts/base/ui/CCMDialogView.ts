/**
 * dialog view
 */

import { tipsMgr } from "./CCMTipsManager";
import { CCMIUIArgs, CCMIUIInfo } from "./CCMUIManager";
import CCMUIView from "./CCMUIView";

const DIALOG_CACHE_TIME = 0; // 界面默认缓存时间(单位：秒)

// 模态提示框回调
export type CCMDialogCallbackTarget = { callback: (...args: any[]) => void, target?: any };

// dialog参数
export interface CCMIDialogOptions extends CCMIUIArgs {
    text: string;
    okText?: string;                            // 确定按钮文字
    cancelText?: string;                        // 取消按钮文字
    okCallback?: CCMDialogCallbackTarget;       // 点击确定按钮回调
    cancelCallback?: CCMDialogCallbackTarget;   // 点击取消按钮回调

    userOptions?: any;                          // 用户自定义参数
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMDialogView extends CCMUIView {

    // 缓存时间(单位：秒)
    @property({ type: cc.Integer, override: true })
    cacheTime: number = DIALOG_CACHE_TIME;

    @property(cc.Label)
    textLabel: cc.Label = null;

    protected _options: CCMIDialogOptions = null; // dialog参数
    public get options(): CCMIDialogOptions { return this._options; }

    public cachedTS: number = 0;        // 开始缓存的时间戳

    /**
     * 当界面被创建时回调，生命周期内只调用一次(子类复写必须前置调用该父类逻辑)
     * @param uiId 界面id
     * @param options 参数
     */
    public init(uiId: number, options: CCMIDialogOptions): void {
        super.init(uiId, options);

        this._options = options;
        if (this.textLabel) this.textLabel.string = options?.text;
    }

    /**
     * 当界面被打开时回调，每次调用 showDialog 时回调
     * @param fromUIInfo 从哪个UI打开的
     * @param options 可变参数
     */
    public onOpen(fromUIInfo: Readonly<CCMIUIInfo>, options: CCMIDialogOptions): void { }

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

    // 点击确定按钮回调
    public okHandler(): void {
        let callbackTarget = this._options.okCallback;
        if (callbackTarget) {
            let callback = callbackTarget.callback;
            let target = callbackTarget.target;
            if (target) {
                callback.call(target, this._options.userOptions);
            } else {
                callback(this._options.userOptions);
            }
        }

        tipsMgr.closeDialog(this);
    }

    // 点击取消按钮回调
    public cancelHandler(): void {
        let callbackTarget = this._options.cancelCallback;
        if (callbackTarget) {
            let callback = callbackTarget.callback;
            let target = callbackTarget.target;
            if (target) {
                callback.call(target, this._options.userOptions);
            } else {
                callback(this._options.userOptions);
            }
        }

        tipsMgr.closeDialog(this);
    }

    // 点击关闭按钮回调
    public closeHandler(): void {
        let callbackTarget = this._options.cancelCallback;
        if (callbackTarget) {
            let callback = callbackTarget.callback;
            let target = callbackTarget.target;
            if (target) {
                callback.call(target, this._options.userOptions);
            } else {
                callback(this._options.userOptions);
            }
        }

        tipsMgr.closeDialog(this);
    }
}
