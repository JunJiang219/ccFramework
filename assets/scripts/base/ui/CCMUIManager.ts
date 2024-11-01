/**
 * UI管理器
 */

import CCMDefaultKeeper from "../res/CCMDefaultKeeper";
import { resLoader } from "../res/CCMResLoader";
import { CCMResReleaseTiming } from "../res/CCMResManager";
import { ProgressCallback } from "../res/CCMResUtil";
import { ccmLog } from "../utils/CCMLog";
import { CCMLayerID, layerMgr } from "./CCMLayerManager";
import CCMUIAnimation, { CCMUIAniName } from "./CCMUIAnimation";
import CCMUIView, { CCMUIShowType } from "./CCMUIView";

const UI_UPDATE_INTERVAL = 5;        // UI管理器更新间隔（单位：秒）

// UI附加参数
export interface CCMIUIArgs {
    aniImmediately?: boolean;   // 开关界面时，动画瞬时完成（即不播动画）
    zOrder?: number;            // 层级顺序
}

// UI信息
export interface CCMIUIInfo {
    uiId: number;                           // UI ID
    uiView: CCMUIView;                      // UI视图
    showType: CCMUIShowType;                // UI显示类型
    uiArgs?: any;                           // ui附加参数
    layerId: CCMLayerID;                    // 层级id
    zOrder?: number;                        // 层级顺序(从1开始)
    preventNode?: cc.Node;                  // 防触摸节点
    isClose?: boolean;                      // 是否关闭
    isOpening?: boolean;                    // 是否正在打开
    isClosing?: boolean;                    // 是否正在关闭
    stackVisible: boolean;                  // 堆栈中是否可见
}

// UI配置
export interface CCMIUIConf {
    bundleName?: string;            // bundle名，不配则取默认值 'resources'
    prefabPath: string;             // UI预制体路径
    showType: CCMUIShowType;        // UI显示类型
    layerId: CCMLayerID;          // 层级id
    multiInstance?: boolean;        // 是否允许多实例
    zOrder?: number;                // 层级顺序
    preventTouch?: boolean;         // 是否添加防触摸穿透节点
    preventColor?: cc.Color;        // 防触摸节点颜色
}

export default class CCMUIManager {

    private static _instance: CCMUIManager = null;
    private constructor() { }
    public static get inst(): CCMUIManager {
        if (null == CCMUIManager._instance) {
            CCMUIManager._instance = new CCMUIManager();
        }
        return CCMUIManager._instance;
    }

    // ui缓存
    private _uiCache: Set<CCMUIView> = new Set();
    // ui界面栈
    private _uiStack: CCMIUIInfo[] = [];
    // ui配置
    private _uiConf: { [uiId: number]: CCMIUIConf } = {};
    // dialog id列表
    private _dialogIds: number[] = [];
    public get dialogIds(): ReadonlyArray<number> {
        return this._dialogIds;
    }
    // toast id列表
    private _toastIds: number[] = [];
    public get toastIds(): ReadonlyArray<number> {
        return this._toastIds;
    }
    // ui更新历时
    private _updateElapsed: number = 0;

    // 初始化ui配置(仅在启动时调用一次)
    public initUIConf(uiConf: { [uiId: number]: CCMIUIConf }, dialogIds: number[], toastIds: number[]) {
        this._uiConf = uiConf;
        this._dialogIds = dialogIds;
        this._toastIds = toastIds;
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
    private _preventTouch(layerId: CCMLayerID, zOrder: number, color?: cc.Color) {
        let node = this._createFullScreenNode(`preventTouch_${layerId}_${zOrder}`);
        let layer = layerMgr.getLayerRoot(layerId);
        layer.addChild(node, zOrder);

        // 添加sprite组件
        let sprComp = node.addComponent(cc.Sprite);
        sprComp.spriteFrame = CCMDefaultKeeper.inst.pureWhiteSpf;
        sprComp.type = cc.Sprite.Type.SIMPLE;
        sprComp.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        if (color) {
            node.color = new cc.Color(color.r, color.g, color.b);
            node.opacity = color.a;
        } else {
            node.color = new cc.Color(0, 0, 0);
            node.opacity = 128;
        }

        node.on(cc.Node.EventType.TOUCH_START, function (event: cc.Event.EventCustom) {
            event.stopPropagation();
        }, node);

        return node;
    }

    // ui栈排序（layer升序 -> zOrder升序）
    private _sortUIStack(uiA: CCMIUIInfo, uiB: CCMIUIInfo) {
        if (uiA.layerId === uiB.layerId) {
            return (uiA.zOrder - uiB.zOrder);
        } else {
            return (uiA.layerId - uiB.layerId);
        }
    }

    // 根据界面显示类型刷新显示
    private _updateUI() {
        let showIndex: number = this._uiStack.length - 1;
        for (; showIndex >= 0; --showIndex) {
            let uiInfo = this._uiStack[showIndex];

            if (CCMUIShowType.UISingle == uiInfo.showType) {
                uiInfo.stackVisible = true;
                if (!uiInfo.isOpening && !uiInfo.isClosing) {
                    if (uiInfo.uiView) uiInfo.uiView.node.active = true;   // 显示UI
                }
                break;
            } else if (CCMUIShowType.UIAddition == uiInfo.showType) {
                uiInfo.stackVisible = true;
                if (!uiInfo.isOpening && !uiInfo.isClosing) {
                    if (uiInfo.uiView) uiInfo.uiView.node.active = true;   // 显示UI
                }
            } else {
                // do nothing
            }
        }

        // 隐藏不应该显示的部分UI
        for (let hideIndex = 0; hideIndex < showIndex; ++hideIndex) {
            let uiInfo = this._uiStack[hideIndex];
            if (CCMUIShowType.UIIndependent !== uiInfo.showType) {
                uiInfo.stackVisible = false;
                if (uiInfo.isOpening || uiInfo.isClosing) continue;     // 正在播放动画，跳过
                if (uiInfo.uiView) uiInfo.uiView.node.active = false;   // 隐藏UI
            }
        }
    }

    /**
     * 自动检测动画组件以及特定动画，如存在则播放动画，无论动画是否播放，都执行回调
     * @param uiView 界面对象
     * @param aniName 动画名
     * @param aniOverCallback 动画播放完成回调
     */
    private _autoExecAnimation(uiView: CCMUIView, aniName: string, aniOverCallback: () => void, aniImmediately?: boolean) {
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
     * 自动检测资源预加载组件，如果存在则加载完成后调用completeCallback，否则直接调用
     * @param preLoadProgressCb 预加载进度回调
     * @param completeCallback 资源加载完成回调
     */
    private _autoLoadRes(uiView: CCMUIView, preLoadProgressCb: ProgressCallback, completeCallback: () => void) {
        uiView.preLoadRes(preLoadProgressCb, completeCallback);
    }

    /**
     * 异步加载一个UI的prefab
     * @param uiId 界面id
     * @param progressCallback 加载进度回调
     * @param preLoadProgressCb 预加载进度回调
     * @param completeCallback 加载完成回调
     * @param uiArgs 界面初始化参数
     */
    private _getOrCreateUI(uiId: number, progressCallback: ProgressCallback, preLoadProgressCb: ProgressCallback, completeCallback: (uiView: CCMUIView) => void, uiArgs: any): void {
        // 先检查缓存
        for (const uiView of this._uiCache) {
            if (cc.isValid(uiView) && uiView.uiId === uiId) {
                // 缓存命中，直接返回
                this._uiCache.delete(uiView);
                uiView.cachedTS = 0;
                completeCallback(uiView);
                return;
            }
        }

        // 找到UI配置
        let uiConf = this._uiConf[uiId];
        let uiPath = uiConf.prefabPath;
        if (!uiPath) {
            ccmLog.log(`getOrCreateUI ${uiId} failed, prefab conf not found!`);
            completeCallback(null);
            return;
        }

        let uiView: CCMUIView = null;
        resLoader.load(uiPath, progressCallback, (err: Error, prefab: any) => {
            if (err) {
                // 加载报错
                ccmLog.log(`getOrCreateUI loadRes ${uiId} failed, path: ${uiPath}, error: ${err}`);
                completeCallback(null);
                return;
            }

            // 检查实例化错误
            let uiNode: cc.Node = cc.instantiate(prefab);
            if (!uiNode) {
                ccmLog.log(`getOrCreateUI instantiate ${uiId} failed, path: ${uiPath}`);
                completeCallback(null);
                return;
            }

            // 检查组件获取错误
            uiView = uiNode.getComponent(CCMUIView);
            if (!uiView) {
                ccmLog.log(`getOrCreateUI getComponent ${uiId} failed, path: ${uiPath}`);
                uiNode.destroy();
                completeCallback(null);
                return;
            }

            // 异步加载UI预加载的资源
            this._autoLoadRes(uiView, preLoadProgressCb, () => {
                uiView.init(uiId, uiArgs);
                if (uiConf.multiInstance) {
                    // 允许多实例，延时销毁资源方式缓存资源
                    uiView.cacheAsset(prefab, { releaseTiming: CCMResReleaseTiming.AfterDestroy });
                } else {
                    // 不允许多实例，及时销毁方式缓存资源
                    uiView.cacheAsset(prefab);
                }
                completeCallback(uiView);
            });
        }, uiConf.bundleName || "resources");
    }

    public open(uiId: number, uiArgs: any = null, aniOverCb: () => void = null, progressCallback: ProgressCallback = null, preLoadProgressCb: ProgressCallback = null): void {
        let uiConf = this._uiConf[uiId];
        if (!uiConf) {
            ccmLog.log(`open ${uiId} failed! not configured`);
            return;
        }


        if (!uiConf.multiInstance) {
            // 不允许多实例，先关闭再打开
            let uiIndexArr = this.getUIIndex(uiId);
            if (uiIndexArr.length > 0) {
                this.close(uiId, { aniImmediately: true });
                this.open(uiId, uiArgs, aniOverCb, progressCallback, preLoadProgressCb);
                return;
            }
        }

        let uiInfo: CCMIUIInfo = {
            uiId: uiId,
            uiView: null,
            showType: uiConf.showType,
            uiArgs: uiArgs,
            layerId: uiConf.layerId,
            preventNode: null,
            stackVisible: true,
        };

        // zOrder赋值
        if (uiArgs && undefined != uiArgs.zOrder) {
            uiInfo.zOrder = uiArgs.zOrder;
        } else if (undefined != uiConf.zOrder) {
            uiInfo.zOrder = uiConf.zOrder;
        } else {
            uiInfo.zOrder = this.getStackNextZOrder(uiConf.layerId);
        }

        this._uiStack.push(uiInfo);
        this._uiStack.sort(this._sortUIStack);

        // 获取排序后的索引
        let uiIndexArr = this.getUIIndex(uiId);

        if (uiConf.preventTouch) {
            // 添加防触摸层
            uiInfo.preventNode = this._preventTouch(uiInfo.layerId, uiInfo.zOrder, uiConf.preventColor);
        }

        uiInfo.isOpening = true;
        uiInfo.isClosing = false;
        this._getOrCreateUI(uiId, progressCallback, preLoadProgressCb, (uiView: CCMUIView) => {
            if (uiInfo.isClose || !uiView) {
                ccmLog.log(`getOrCreateUI ${uiId} failed! close state : ${uiInfo.isClose} , uiView : ${uiView}`);

                if (uiIndexArr.length >= 0) {
                    // 创建失败，从堆栈删除
                    this._uiStack.splice(uiIndexArr[uiIndexArr.length - 1], 1);
                }
                if (uiInfo.preventNode) {
                    uiInfo.preventNode.destroy();
                    uiInfo.preventNode = null;
                }

                uiInfo.isOpening = false;
                uiInfo.isClosing = false;
                uiView?.node.destroy();

                return;
            }

            this._onUIOpen(uiId, uiView, uiInfo, aniOverCb);
        }, uiArgs);
    }

    /**
     * UI被打开时回调，对UI进行初始化设置，刷新其他界面的显示，并根据
     * @param uiId 哪个界面被打开了
     * @param uiView 界面对象
     * @param uiInfo 界面栈对应的信息结构
     */
    private _onUIOpen(uiId: number, uiView: CCMUIView, uiInfo: CCMIUIInfo, aniOverCb: () => void = null) {
        if (!uiView) return;

        uiInfo.uiView = uiView;
        uiView.node.zIndex = uiInfo.zOrder;
        uiView.node.parent = layerMgr.getLayerRoot(uiInfo.layerId);
        uiView.node.active = true;

        // 快速关闭界面的设置，绑定界面中的 background，实现快速关闭
        if (uiView.quickClose) {
            let backGround = uiView.node.getChildByName('background');
            if (!backGround) {
                backGround = this._createFullScreenNode('background');
                uiView.node.addChild(backGround, -1);
            }
            backGround.targetOff(cc.Node.EventType.TOUCH_END);
            backGround.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventCustom) => {
                event.stopPropagation();
                if (uiInfo.isOpening || uiInfo.isClosing) return;   // 正在播放动画，不响应
                this.close(uiView, uiInfo.uiArgs);
            }, backGround);
        }

        // 刷新其他界面的显示
        this._updateUI();

        // 从哪个界面打开的
        let fromUIInfo: Readonly<CCMIUIInfo> = null;
        if (this.isTopShowUI(uiView)) {
            fromUIInfo = this.getTopShowUIInfo(2);
        } else {
            fromUIInfo = this.getTopShowUIInfo(1);
        }
        uiView.onOpen(fromUIInfo);
        this._autoExecAnimation(uiView, CCMUIAniName.UIOpen, () => {
            // 动画播放完成回调
            uiInfo.isOpening = false;
            uiView.onOpenAniOver();
            uiView.node.active = uiInfo.stackVisible;   // 动画播完后设置节点显示隐藏状态
            if (aniOverCb) aniOverCb();
        }, uiInfo.uiArgs?.aniImmediately);
    }

    // 关闭指定界面
    public close(uiOrId: CCMUIView | number, uiArgs: any = null, aniOverCb: () => void = null, noCache: boolean = false) {
        let uiIndexArr = this.getUIIndex(uiOrId);
        if (uiIndexArr.length <= 0) {
            if ('number' == typeof uiOrId) {
                ccmLog.log(`close ${uiOrId} failed! not found`);
            } else {
                ccmLog.log(`close ${uiOrId.uiId} failed! not found`);
            }
            return;
        }

        // 循环关闭
        let aniCnt = uiIndexArr.length;
        for (let i = uiIndexArr.length - 1; i >= 0; --i) {
            let uiIndex = uiIndexArr[i];
            let uiInfo = this._uiStack[uiIndex];
            let uiView = uiInfo.uiView;
            uiInfo.isClose = true;

            this._uiStack.splice(uiIndex, 1);   // 必须倒着删除，否则索引会变化
            // 刷新其他界面的显示
            this._updateUI();

            if (!uiView) continue;

            uiInfo.isOpening = false;
            uiInfo.isClosing = true;
            this._autoExecAnimation(uiView, CCMUIAniName.UIClose, () => {
                // 动画播放完成回调
                uiInfo.isClosing = false;

                // 删除防触摸层
                if (uiInfo.preventNode) {
                    uiInfo.preventNode.destroy();
                    uiInfo.preventNode = null;
                }

                let preUIInfo = this.getTopShowUIInfo();
                if (preUIInfo) {
                    preUIInfo.uiView?.onTop(uiInfo, uiView.onClose());
                } else {
                    uiView.onClose();
                }

                if (noCache) {
                    // 销毁ui，释放资源
                    uiView.cachedTS = 0;
                    uiView.releaseAssets(true);
                    uiView.node.destroy();
                } else {
                    if (uiView.cacheTime > 0) {
                        // 缓存ui
                        this._uiCache.add(uiView);
                        uiView.cachedTS = Math.floor(Date.now() / 1000);
                        uiView.node.removeFromParent();
                    } else {
                        // 销毁ui
                        uiView.cachedTS = 0;
                        uiView.node.destroy();
                    }
                }

                --aniCnt;
                if (aniCnt <= 0 && aniOverCb) {
                    aniOverCb();
                }
            }, uiArgs?.aniImmediately);
        }

        return;
    }

    // 关闭所有界面
    public closeAll(noCache: boolean = false, ignoreUIIds?: number[]) {
        // 不播放动画，也不清理缓存
        ignoreUIIds = ignoreUIIds || [];
        let newUIStack: CCMIUIInfo[] = [];
        if (noCache) {
            for (const uiInfo of this._uiStack) {
                if (ignoreUIIds.indexOf(uiInfo.uiId) < 0) {
                    uiInfo.isClose = true;
                    uiInfo.isOpening = false;
                    uiInfo.isClosing = false;
                    if (uiInfo.preventNode) {
                        uiInfo.preventNode.destroy();
                        uiInfo.preventNode = null;
                    }

                    if (uiInfo.uiView) {
                        // 销毁ui，释放资源
                        uiInfo.uiView.onClose();
                        uiInfo.uiView.releaseAssets(true);
                        uiInfo.uiView.node.destroy();
                    }
                } else {
                    // 在忽略列表中, 放入新列表
                    newUIStack.push(uiInfo);
                }
            }
        } else {
            for (const uiInfo of this._uiStack) {
                if (ignoreUIIds.indexOf(uiInfo.uiId) < 0) {
                    uiInfo.isClose = true;
                    uiInfo.isOpening = false;
                    uiInfo.isClosing = false;
                    if (uiInfo.preventNode) {
                        uiInfo.preventNode.destroy();
                        uiInfo.preventNode = null;
                    }

                    if (uiInfo.uiView) {
                        // 销毁ui
                        uiInfo.uiView.onClose();
                        uiInfo.uiView.node.destroy();
                    }
                } else {
                    // 在忽略列表中, 放入新列表
                    newUIStack.push(uiInfo);
                }
            }
        }
        this._uiStack = newUIStack;
    }

    // 清理界面缓存
    public clearCache() {
        this._uiCache.forEach(uiView => {
            if (cc.isValid(uiView)) {
                uiView.releaseAssets(true);
                uiView.node.destroy();
            }
        });
        this._uiCache.clear();
    }

    // 隐藏界面
    public hide(uiOrId: CCMUIView | number) {
        let uiIndexArr = this.getUIIndex(uiOrId);
        if (uiIndexArr.length < 0) {
            if ('number' == typeof uiOrId) {
                ccmLog.log(`hide ${uiOrId} failed! not found`);
            } else {
                ccmLog.log(`hide ${uiOrId.uiId} failed! not found`);
            }
            return;
        }

        for (let i = 0; i < uiIndexArr.length; ++i) {
            let uiIndex = uiIndexArr[i];
            let uiInfo = this._uiStack[uiIndex];
            let uiView = uiInfo.uiView;
            if (uiView) {
                if (uiInfo.isOpening || uiInfo.isClosing) return;   // 打开关闭动画中，不响应

                uiInfo.stackVisible = false;
                uiView.node.active = false;
                if (uiInfo.preventNode) uiInfo.preventNode.active = false;
            }
        }
    }

    // 显示界面
    public show(uiOrId: CCMUIView | number) {
        let uiIndexArr = this.getUIIndex(uiOrId);
        if (uiIndexArr.length < 0) {
            if ('number' == typeof uiOrId) {
                ccmLog.log(`show ${uiOrId} failed! not found`);
            } else {
                ccmLog.log(`show ${uiOrId.uiId} failed! not found`);
            }
            return;
        }

        for (let i = 0; i < uiIndexArr.length; ++i) {
            let uiIndex = uiIndexArr[i];
            let uiInfo = this._uiStack[uiIndex];
            let uiView = uiInfo.uiView;
            if (uiView) {
                if (uiInfo.isOpening || uiInfo.isClosing) return;   // 打开关闭动画中，不响应

                uiInfo.stackVisible = true;
                uiView.node.active = true;
                if (uiInfo.preventNode) uiInfo.preventNode.active = true;
            }
        }
    }

    public update(dt: number) {
        this._updateElapsed += dt;
        if (this._updateElapsed >= UI_UPDATE_INTERVAL) {
            // 每5秒更新一次
            this._updateElapsed = 0;
            let curTimestamp = Math.floor(Date.now() / 1000);
            let toDelete: CCMUIView[] = [];

            this._uiCache.forEach(uiView => {
                if (cc.isValid(uiView)) {
                    if (uiView.cacheTime > 0 && curTimestamp - uiView.cachedTS >= uiView.cacheTime) {
                        // 缓存过期，销毁界面
                        uiView.node.destroy();
                        toDelete.push(uiView);
                    }
                } else {
                    // 失效ui，销毁
                    toDelete.push(uiView);
                }
            });

            toDelete.forEach(uiView => {
                this._uiCache.delete(uiView);
            });
        }

    }

    // 获取堆栈中的UI
    public getUI(uiId: number): Readonly<CCMUIView>[] {
        let retArr: CCMUIView[] = [];
        for (let i = 0; i < this._uiStack.length; i++) {
            if (this._uiStack[i].uiId == uiId) {
                retArr.push(this._uiStack[i].uiView);
            }
        }

        return retArr;
    }

    // 获取堆栈中的UI索引
    public getUIIndex(uiOrId: CCMUIView | number): ReadonlyArray<number> {
        let retArr: number[] = [];
        if ('number' == typeof uiOrId) {
            for (let i = 0; i < this._uiStack.length; i++) {
                if (this._uiStack[i].uiId == uiOrId) {
                    retArr.push(i);
                }
            }
        } else {
            for (let i = 0; i < this._uiStack.length; i++) {
                if (this._uiStack[i].uiView === uiOrId) {
                    retArr.push(i);
                    break;
                }
            }
        }

        return retArr;
    }

    // 获取堆栈中的UI信息
    public getUIInfo(uiOrId: CCMUIView | number): Readonly<CCMIUIInfo>[] {
        let retArr: CCMIUIInfo[] = [];
        if ('number' == typeof uiOrId) {
            for (let i = 0; i < this._uiStack.length; i++) {
                if (this._uiStack[i].uiId == uiOrId) {
                    retArr.push(this._uiStack[i]);
                }
            }
        } else {
            for (let i = 0; i < this._uiStack.length; i++) {
                if (this._uiStack[i].uiView === uiOrId) {
                    retArr.push(this._uiStack[i]);
                    break;
                }
            }
        }

        return retArr;
    }

    // 获取堆栈UI下一个zOrder
    private getStackNextZOrder(layerId: number): number {
        let zOrder = 0;
        for (let i = 0; i < this._uiStack.length; ++i) {
            let uiInfo = this._uiStack[i];
            if (uiInfo.layerId == layerId) {
                zOrder = uiInfo.zOrder;
            } else if (uiInfo.layerId > layerId) {
                break;
            }
        }

        return zOrder + 1;
    }

    // ui是否正在显示
    public isShowing(uiOrId: CCMUIView | number): boolean {
        let uiInfoArr = this.getUIInfo(uiOrId);
        for (let i = 0; i < uiInfoArr.length; ++i) {
            if (uiInfoArr[i].stackVisible) return true;
        }

        return false;
    }

    /**
     * 获取栈顶显示UI
     * @param topNum 获取栈顶的第几个UI，默认获取栈顶的UI
     * @returns 
     */
    public getTopShowUIInfo(topNum: number = 1): Readonly<CCMIUIInfo> {
        if (this._uiStack.length >= topNum) {
            let cnt: number = 0;
            for (let i = this._uiStack.length - 1; i >= 0; i--) {
                let uiInfo = this._uiStack[i];
                switch (uiInfo.showType) {
                    case CCMUIShowType.UIIndependent:
                        if (uiInfo.stackVisible) ++cnt;
                        break;
                    default:
                        ++cnt;
                        break;
                }

                if (cnt == topNum) return uiInfo;
            }
        }

        return null;
    }

    /**
     * 获取栈顶显示UI索引
     * @param topNum 获取栈顶的第几个UI，默认获取栈顶的UI
     * @returns 
     */
    public getTopShowUIIndex(topNum: number = 1): number {
        if (this._uiStack.length >= topNum) {
            let cnt: number = 0;
            for (let i = this._uiStack.length - 1; i >= 0; i--) {
                let uiInfo = this._uiStack[i];
                switch (uiInfo.showType) {
                    case CCMUIShowType.UIIndependent:
                        if (uiInfo.stackVisible) ++cnt;
                        break;
                    default:
                        ++cnt;
                        break;
                }

                if (cnt == topNum) return i;
            }
        }

        return -1;
    }

    // 是否栈顶显示UI
    public isTopShowUI(uiOrId: CCMUIView | number): boolean {
        let uiIndexArr = this.getUIIndex(uiOrId);
        if (uiIndexArr.length < 0) {
            return false;
        } else {
            let tmpUIIndex = uiIndexArr[uiIndexArr.length - 1];
            return tmpUIIndex == this.getTopShowUIIndex();
        }
    }
}

export const uiMgr = CCMUIManager.inst;