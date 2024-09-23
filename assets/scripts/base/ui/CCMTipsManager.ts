/**
 * 提示管理器
 */

import DefaultKeeper from "../../manager/DefaultKeeper";
import { resLoader } from "../res/CCMResLoader";
import { CCMResCacheArgs, CCMResReleaseTiming } from "../res/CCMResManager";
import { ccmLog } from "../utils/CCMLog";
import CCMDialogView, { CCMIDialogOptions } from "./CCMDialogView";
import CCMToastView, { CCMIToastOptions } from "./CCMToastView";
import CCMUIAnimation, { CCMUIAniName } from "./CCMUIAnimation";
import { uiMgr } from "./CCMUIManager";
import { CCMUILayerID } from "./CCMUIView";

const ASSET_DELAY_RELEASE_TIME = 60; // 资源默认延迟释放时间（单位：秒）
const CHECK_INTERVAL = 5;   // 提示管理器更新间隔（单位：秒）

// dialog配置
export interface CCMIDialogConf {
    bundleName?: string;          // bundle名，不配则取默认值 'resources'
    prefabPath: string;           // UI预制体路径
    preventTouch?: boolean;       // 是否添加防触摸穿透节点
    preventColor?: cc.Color;      // 防触摸节点颜色
}

// dialog信息
export interface CCMIDialogInfo {
    dialogId: number;                           // UI ID
    dialogOptions: CCMIDialogOptions;           // UI参数
    dialogView: CCMDialogView;                  // UI视图
    zOrder: number;                             // 层级顺序
    preventNode?: cc.Node;                      // 防触摸节点
    isClose?: boolean;                          // 是否关闭
}

// toast配置
export interface CCMIToastConf {
    bundleName?: string;          // bundle名，不配则取默认值'resources'
    prefabPath: string;           // UI预制体路径
}

// toast信息
export interface CCMIToastInfo {
    toastId: number;                           // UI ID
    toastOptions: CCMIDialogOptions;           // UI参数
    toastView: CCMToastView;                  // UI视图
    zOrder: number;                            // 层级顺序
    isClose?: boolean;                         // 是否关闭
}

export default class CCMTipsManager {

    private static _instance: CCMTipsManager;
    private constructor() { }
    public static get inst(): CCMTipsManager {
        if (!CCMTipsManager._instance) {
            CCMTipsManager._instance = new CCMTipsManager();
        }
        return CCMTipsManager._instance;
    }

    // ui更新历时
    private _updateElapsed: number = 0;
    // dialog配置
    private _dialogConf: { [dialogId: number]: CCMIDialogConf } = {};
    // dialog界面栈
    private _dialogStack: CCMIDialogInfo[] = [];
    // dialog缓存
    private _dialogCache: Set<CCMDialogView> = new Set();

    // toast配置
    private _toastConf: { [toastId: number]: CCMIToastConf } = {};
    // toast界面栈
    private _toastStack: CCMIToastInfo[] = [];
    // toast缓存
    private _toastCache: Set<CCMToastView> = new Set();

    // 初始化dialog配置
    public initDialogConf(dialogConf: { [dialogId: number]: CCMIDialogConf }) {
        this._dialogConf = dialogConf;
    }

    // 初始化toast配置
    public initToastConf(toastConf: { [toastId: number]: CCMIToastConf }) {
        this._toastConf = toastConf;
    }

    // 创建全屏节点
    private _createFullScreenNode(nodeName?: string): cc.Node {
        let node = new cc.Node()
        if (nodeName) node.name = nodeName;
        let cvs = cc.find("Canvas");
        node.setContentSize(cvs.width, cvs.height);

        let widget = node.addComponent(cc.Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
        widget.target = cvs;
        widget.alignMode = cc.Widget.AlignMode.ON_WINDOW_RESIZE;

        return node;
    }

    /**
     * 添加防触摸层
     * @param layerId 层级id
     * @param zOrder 屏蔽层的层级
     * @param color 防触摸节点颜色
     */
    private _preventTouch(layerId: CCMUILayerID, zOrder: number, color?: cc.Color) {
        let node = cc.instantiate(DefaultKeeper.inst.preventPrefab);
        node.name = `@preventTouch_${layerId}_${zOrder}`;
        if (color) {
            node.color = new cc.Color(color.r, color.g, color.b);
            node.opacity = color.a;
        }

        let widget = node.getComponent(cc.Widget);
        widget.target = cc.find("Canvas");
        let layer = uiMgr.getLayerRoot(layerId);
        layer.addChild(node, zOrder);

        node.on(cc.Node.EventType.TOUCH_START, function (event: cc.Event.EventCustom) {
            event.stopPropagation();
        }, node);

        return node;
    }

    /**
     * 自动检测动画组件以及特定动画，如存在则播放动画，无论动画是否播放，都执行回调
     * @param uiView 界面对象
     * @param aniName 动画名
     * @param aniOverCallback 动画播放完成回调
     */
    private _autoExecAnimation(uiView: CCMDialogView | CCMToastView, aniName: string, aniOverCallback: () => void, aniImmediately?: boolean) {
        let aniComponent = uiView.node.getComponent(CCMUIAnimation);
        if (aniComponent) {
            switch (aniName) {
                case CCMUIAniName.UIOpen:
                    // 播放动画
                    aniComponent.execAni_UIOpen(aniOverCallback, aniImmediately);
                    break;
                case CCMUIAniName.UIClose:
                    // 播放动画
                    aniComponent.execAni_UIClose(aniOverCallback, aniImmediately);
                    break;
            }
        } else {
            aniOverCallback();
        }
    }

    /**
     * 异步加载一个dialog的prefab
     * @param dialogId 界面id
     * @param completeCallback 加载完成回调
     * @param options 界面初始化参数
     */
    private _getOrCreateDialog(dialogId: number, completeCallback: (dialogView: CCMDialogView) => void, options: CCMIDialogOptions): void {
        // 找到UI配置
        let dialogConf = this._dialogConf[dialogId];
        let dialogPath = dialogConf.prefabPath;
        if (!dialogPath) {
            ccmLog.log(`_getOrCreateDialog ${dialogId} failed, prefab conf not found!`);
            completeCallback(null);
            return;
        }

        let dialogView: CCMDialogView = null;
        resLoader.load(dialogConf.bundleName || "resources", dialogPath, (err: Error, prefab: any) => {
            if (err) {
                // 加载报错
                ccmLog.log(`_getOrCreateDialog loadRes ${dialogId} failed, path: ${dialogPath}, error: ${err}`);
                completeCallback(null);
                return;
            }

            // 检查实例化错误
            let uiNode: cc.Node = cc.instantiate(prefab);
            if (!uiNode) {
                ccmLog.log(`_getOrCreateDialog instantiate ${dialogId} failed, path: ${dialogPath}`);
                completeCallback(null);
                return;
            }

            // 检查组件获取错误
            dialogView = uiNode.getComponent(CCMDialogView);
            if (!dialogView) {
                ccmLog.log(`_getOrCreateDialog getComponent ${dialogId} failed, path: ${dialogPath}`);
                uiNode.destroy();
                completeCallback(null);
                return;
            }

            dialogView.init(dialogId, options);
            let args: CCMResCacheArgs = {
                releaseTiming: CCMResReleaseTiming.AfterDestroy,
                keepTime: ASSET_DELAY_RELEASE_TIME,
            };
            dialogView.cacheAsset(prefab, args);
            completeCallback(dialogView);
        });
    }

    public showDialog(options: CCMIDialogOptions, closeOther: boolean = false, dialogId: number = 0) {
        let dialogConf = this._dialogConf[dialogId];
        if (!dialogConf) {
            ccmLog.log(`showDialog ${dialogId} failed! not configured`);
            return;
        }
        if (closeOther) this.closeAllDialogs();

        let zOrder = this._dialogStack.length + 1;
        let dialogInfo: CCMIDialogInfo = {
            dialogId: dialogId,
            dialogOptions: options,
            dialogView: null,
            zOrder: zOrder,
            preventNode: null,
        };
        this._dialogStack.push(dialogInfo);

        if (dialogConf.preventTouch) {
            // 添加防触摸层
            dialogInfo.preventNode = this._preventTouch(CCMUILayerID.Dialog, zOrder, dialogConf.preventColor);
        }

        this._getOrCreateDialog(dialogId, (dialogView: CCMDialogView) => {
            if (dialogInfo.isClose || !dialogView) {
                ccmLog.log(`getOrCreateUI ${dialogId} failed! close state : ${dialogInfo.isClose} , dialogView : ${dialogView}`);

                if (dialogInfo.preventNode) {
                    dialogInfo.preventNode.destroy();
                    dialogInfo.preventNode = null;
                }

                dialogView?.node.destroy();

                return;
            }

            this._onDialogOpen(dialogId, dialogView, dialogInfo, options);
        }, options);
    }

    /**
     * UI被打开时回调，对UI进行初始化设置，刷新其他界面的显示，并根据
     * @param dialogId 哪个界面被打开了
     * @param dialogView 界面对象
     * @param dialogInfo 界面栈对应的信息结构
     * @param options 界面初始化参数
     */
    private _onDialogOpen(dialogId: number, dialogView: CCMDialogView, dialogInfo: CCMIDialogInfo, options: CCMIDialogOptions) {
        if (!dialogView) return;

        dialogInfo.dialogView = dialogView;
        dialogView.node.zIndex = dialogInfo.zOrder;
        dialogView.node.parent = uiMgr.getLayerRoot(CCMUILayerID.Dialog);
        dialogView.node.active = true;

        // 快速关闭界面的设置，绑定界面中的 @background，实现快速关闭
        if (dialogView.quickClose) {
            let backGround = dialogView.node.getChildByName('@background');
            if (!backGround) {
                backGround = this._createFullScreenNode('@background');
                dialogView.node.addChild(backGround, -1);
            }
            backGround.targetOff(cc.Node.EventType.TOUCH_END);
            backGround.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventCustom) => {
                event.stopPropagation();
                let aniComponent = dialogView.node.getComponent(CCMUIAnimation);
                if (aniComponent && aniComponent.curAniName != CCMUIAniName.UINone) return;   // 正在播放动画，不响应
                this.closeDialog(dialogView);
            }, backGround);
        }

        dialogView.onOpen(options);
        this._autoExecAnimation(dialogView, CCMUIAniName.UIOpen, () => {
            // 动画播放完成回调
            dialogView.onOpenAniOver();
        }, options?.aniImmediately);
    }

    // 关闭指定dialog
    public closeDialog(dialogView: CCMDialogView, options?: CCMIDialogOptions, noCache: boolean = false) {
        let dialogIndex = this.getDialogIndex(dialogView);
        if (dialogIndex < 0) {
            ccmLog.log(`close ${dialogView.dialogId} failed! not found`);
            return false;
        }

        let dialogInfo = this._dialogStack[dialogIndex];
        let aniComponent = dialogView.node.getComponent(CCMUIAnimation);
        if (aniComponent && aniComponent.curAniName != CCMUIAniName.UINone) return false;   // 正在播放动画，不响应

        dialogInfo.isClose = true;
        if (dialogInfo.preventNode) {
            dialogInfo.preventNode.destroy();
            dialogInfo.preventNode = null;
        }
        this._dialogStack.splice(dialogIndex, 1);

        this._autoExecAnimation(dialogView, CCMUIAniName.UIClose, () => {
            // 动画播放完成回调
            if (noCache) {
                // 销毁ui，释放资源
                dialogView.cachedTS = 0;
                dialogView.releaseAssets(true);
                dialogView.node.destroy();
            } else {
                if (dialogView.cacheTime > 0) {
                    // 缓存ui
                    this._dialogCache.add(dialogView);
                    dialogView.cachedTS = Math.floor(Date.now() / 1000);
                    dialogView.node.removeFromParent();
                } else {
                    // 销毁ui
                    dialogView.cachedTS = 0;
                    dialogView.node.destroy();
                }
            }
        }, options?.aniImmediately);

        return true;
    }

    // 关闭所有dialog
    public closeAllDialogs() {
        for (const dialogInfo of this._dialogStack) {
            dialogInfo.isClose = true;
            if (dialogInfo.preventNode) {
                dialogInfo.preventNode.destroy();
                dialogInfo.preventNode = null;
            }

            if (dialogInfo.dialogView) {
                // 销毁ui，释放资源
                dialogInfo.dialogView.releaseAssets(true);
                dialogInfo.dialogView.node.destroy();
            }
        }
        this._dialogStack = [];
    }

    // 清理界面缓存
    public clearCache() {
        this._dialogCache.forEach(dialogView => {
            if (cc.isValid(dialogView)) {
                dialogView.releaseAssets(true);
                dialogView.node.destroy();
            }
        });

        this._toastCache.forEach(toastView => {
            if (cc.isValid(toastView)) {
                toastView.releaseAssets(true);
                toastView.node.destroy();
            }
        });

        this._dialogCache.clear();
        this._toastCache.clear();
    }

    private _getOrCreateToast(toastId: number, completeCallback: (toastView: CCMToastView) => void, options: CCMIToastOptions): void {
        // 找到UI配置
        let toastConf = this._toastConf[toastId];
        let toastPath = toastConf.prefabPath;
        if (!toastPath) {
            ccmLog.log(`_getOrCreateToast ${toastId} failed, prefab conf not found!`);
            completeCallback(null);
            return;
        }

        let toastView: CCMToastView = null;
        resLoader.load(toastConf.bundleName || "resources", toastPath, (err: Error, prefab: any) => {
            if (err) {
                // 加载报错
                ccmLog.log(`_getOrCreateToast loadRes ${toastId} failed, path: ${toastPath}, error: ${err}`);
                completeCallback(null);
                return;
            }

            // 检查实例化错误
            let uiNode: cc.Node = cc.instantiate(prefab);
            if (!uiNode) {
                ccmLog.log(`_getOrCreateToast instantiate ${toastId} failed, path: ${toastPath}`);
                completeCallback(null);
                return;
            }

            // 检查组件获取错误
            toastView = uiNode.getComponent(CCMToastView);
            if (!toastView) {
                ccmLog.log(`_getOrCreateToast getComponent ${toastId} failed, path: ${toastPath}`);
                uiNode.destroy();
                completeCallback(null);
                return;
            }

            toastView.init(toastId, options);
            let args: CCMResCacheArgs = {
                releaseTiming: CCMResReleaseTiming.AfterDestroy,
                keepTime: ASSET_DELAY_RELEASE_TIME,
            };
            toastView.cacheAsset(prefab, args);
            completeCallback(toastView);
        });
    }

    public showToast(options: CCMIToastOptions, closeOther: boolean = false, toastId: number = 0) {
        let toastConf = this._toastConf[toastId];
        if (!toastConf) {
            ccmLog.log(`showToast ${toastId} failed! not configured`);
            return;
        }
        if (closeOther) this.closeAllToasts();

        let zOrder = this._toastStack.length + 1;
        let toastInfo: CCMIToastInfo = {
            toastId: toastId,
            toastOptions: options,
            toastView: null,
            zOrder: zOrder,
        };
        this._toastStack.push(toastInfo);

        this._getOrCreateToast(toastId, (toastView: CCMToastView) => {
            if (toastInfo.isClose || !toastView) {
                ccmLog.log(`_getOrCreateToast ${toastId} failed! close state : ${toastInfo.isClose} , toastView : ${toastView}`);
                toastView?.node.destroy();
                return;
            }

            this._onToastOpen(toastId, toastView, toastInfo, options);
        }, options);
    }

    private _onToastOpen(toastId: number, toastView: CCMToastView, toastInfo: CCMIToastInfo, options: CCMIToastOptions) {
        if (!toastView) return;

        toastInfo.toastView = toastView;
        toastView.node.zIndex = toastInfo.zOrder;
        toastView.node.parent = uiMgr.getLayerRoot(CCMUILayerID.Toast);
        toastView.node.active = true;

        toastView.onOpen(options);
        this._autoExecAnimation(toastView, CCMUIAniName.UIOpen, () => {
            // 动画播放完成回调
            toastView.onOpenAniOver();
        }, options?.aniImmediately);
    }

    public closeToast(toastView: CCMToastView, options?: CCMIToastOptions, noCache: boolean = false) {
        let toastIndex = this.getToastIndex(toastView);
        if (toastIndex < 0) {
            ccmLog.log(`closeToast ${toastView.toastId} failed! not found`);
            return false;
        }

        let toastInfo = this._toastStack[toastIndex];
        let aniComponent = toastView.node.getComponent(CCMUIAnimation);
        if (aniComponent && aniComponent.curAniName != CCMUIAniName.UINone) return false;   // 正在播放动画，不响应

        toastInfo.isClose = true;
        this._toastStack.splice(toastIndex, 1);

        this._autoExecAnimation(toastView, CCMUIAniName.UIClose, () => {
            // 动画播放完成回调
            if (noCache) {
                // 销毁ui，释放资源
                toastView.cachedTS = 0;
                toastView.releaseAssets(true);
                toastView.node.destroy();
            } else {
                if (toastView.cacheTime > 0) {
                    // 缓存ui
                    this._toastCache.add(toastView);
                    toastView.cachedTS = Math.floor(Date.now() / 1000);
                    toastView.node.removeFromParent();
                } else {
                    // 销毁ui
                    toastView.cachedTS = 0;
                    toastView.node.destroy();
                }
            }
        }, options?.aniImmediately);

        return true;
    }

    public closeAllToasts() {
        for (const toastInfo of this._toastStack) {
            toastInfo.isClose = true;
            if (toastInfo.toastView) {
                // 销毁ui，释放资源
                toastInfo.toastView.releaseAssets(true);
                toastInfo.toastView.node.destroy();
            }
            this._toastStack = [];
        }
    }

    public getToastIndex(toastView: CCMToastView): number {
        for (let i = 0; i < this._toastStack.length; i++) {
            if (this._toastStack[i].toastView === toastView) {
                return i;
            }
        }

        return -1;
    }

    public update(dt: number) {
        this._updateElapsed += dt;
        if (this._updateElapsed >= CHECK_INTERVAL) {
            // 每5秒更新一次
            this._updateElapsed = 0;
            let curTimestamp = Math.floor(Date.now() / 1000);

            let toDeleteDialogs: CCMDialogView[] = [];
            this._dialogCache.forEach(uiView => {
                if (cc.isValid(uiView) && uiView.cacheTime > 0) {
                    if (curTimestamp - uiView.cachedTS >= uiView.cacheTime) {
                        // 缓存过期，销毁界面
                        uiView.destroy();
                        toDeleteDialogs.push(uiView);
                    }
                }
            });
            toDeleteDialogs.forEach(uiView => {
                this._dialogCache.delete(uiView);
            });

            let toDeleteToasts: CCMToastView[] = [];
            this._toastCache.forEach(uiView => {
                if (cc.isValid(uiView) && uiView.cacheTime > 0) {
                    if (curTimestamp - uiView.cachedTS >= uiView.cacheTime) {
                        // 缓存过期，销毁界面
                        uiView.destroy();
                        toDeleteToasts.push(uiView);
                    }
                }
            });
            toDeleteToasts.forEach(uiView => {
                this._toastCache.delete(uiView);
            });
        }

    }

    // 获取堆栈中的UI索引
    public getDialogIndex(dialogView: CCMDialogView): number {
        for (let i = 0; i < this._dialogStack.length; i++) {
            if (this._dialogStack[i].dialogView === dialogView) {
                return i;
            }
        }

        return -1;
    }

    public getTopDialog(): CCMDialogView {
        if (this._dialogStack.length > 0) {
            return this._dialogStack[this._dialogStack.length - 1].dialogView;
        }

        return null;
    }
}

export const tipsMgr = CCMTipsManager.inst;