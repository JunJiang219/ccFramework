/**
 * dialog view
 */

import { CCMResKeeper } from "../res/CCMResKeeper";
import { tipsMgr } from "./CCMTipsManager";

const DIALOG_CACHE_TIME = 180; // 界面默认缓存时间(单位：秒)

// 模态提示框回调
export type CCMDialogCallbackTarget = { callback: (...args: any[]) => void, target?: any };

// dialog参数
export interface CCMIDialogOptions {
    text: string;
    okText?: string;                            // 确定按钮文字
    cancelText?: string;                        // 取消按钮文字
    okCallback?: CCMDialogCallbackTarget;       // 点击确定按钮回调
    cancelCallback?: CCMDialogCallbackTarget;   // 点击取消按钮回调

    aniImmediately?: boolean;                   // 开关界面时，动画瞬时完成（即不播动画）
    userOptions?: any;                          // 用户自定义参数
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMDialogView extends CCMResKeeper {

    // 快速关闭
    @property
    quickClose: boolean = false;

    // 缓存时间(单位：秒)
    @property({ type: cc.Integer })
    cacheTime: number = DIALOG_CACHE_TIME;

    @property(cc.Label)
    textLabel: cc.Label = null;

    private static _instCnt: number = 0; // 界面实例计数器

    private _dialogId: number = 0; // 界面id
    public get dialogId(): number { return this._dialogId; }

    private _instId: number = 0; // 界面实例唯一标识符
    public get instId(): number { return this._instId; }

    private _options: CCMIDialogOptions = null; // dialog参数
    public get options(): CCMIDialogOptions { return this._options; }

    public cachedTS: number = 0;        // 开始缓存的时间戳

    /**
     * 当界面被创建时回调，生命周期内只调用一次(子类复写必须前置调用该父类逻辑)
     * @param dialogId 界面id
     * @param options 参数
     */
    public init(dialogId: number, options: CCMIDialogOptions): void {
        this._dialogId = dialogId;
        this._instId = ++CCMDialogView._instCnt;
        this._options = options;
        if (this.textLabel) this.textLabel.string = options?.text;
    }

    /**
     * 当界面被打开时回调，每次调用 showDialog 时回调
     * @param fromDialog 打开该dialog前的dialog实例
     * @param options 可变参数
     */
    public onOpen(fromDialog: CCMDialogView, options: CCMIDialogOptions): void { }

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
