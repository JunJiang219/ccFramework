/**
 * UI管理器
 */

import DefaultKeeper from "../../manager/DefaultKeeper";
import { ProgressCallback, resLoader } from "../res/CCMResLoader";
import { ccmLog } from "../utils/CCMLog";
import CCMUIAnimation, { CCMUIAniName } from "./CCMUIAnimation";
import CCMUIView, { CCMUILayerID } from "./CCMUIView";

const UI_UPDATE_INTERVAL = 5;        // UI管理器更新间隔（单位：秒）

// UI附加参数
export interface CCMIUIArgs {
    aniImmediately?: boolean;   // 开关界面时，动画瞬时完成（即不播动画）
    openFromUIID?: number;      // 打开界面时，指定从哪个界面打开
    userOptions?: any;          // 用户自定义参数
}

// UI信息
export interface CCMIUIInfo {
    uiId: number;                           // UI ID
    uiArgs: CCMIUIArgs | null;              // ui附加参数
    uiView: CCMUIView | null;               // UI视图
    layerId: CCMUILayerID;                  // 层级id
    zOrder: number;                         // 层级顺序
    preventNode?: cc.Node;                  // 防触摸节点
    isClose?: boolean;                      // 是否关闭
}

// UI配置
export interface CCMIUIConf {
    bundleName?: string;          // bundle名，不配则取默认值 'resources'
    prefabPath: string;           // UI预制体路径
    layerId: CCMUILayerID;        // 层级id
    zOrder: number;               // 层级顺序
    preventTouch?: boolean;       // 是否添加防触摸穿透节点
    preventColor?: cc.Color;      // 防触摸节点颜色
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

    // 层级根节点
    private _layerRoot: cc.Node[] = [];
    // ui缓存
    private _uiCache: Set<CCMUIView> = new Set();
    // ui界面栈
    private _uiStack: CCMIUIInfo[] = [];
    // ui配置
    private _uiConf: { [uiId: number]: CCMIUIConf } = {};
    // ui更新历时
    private _updateElapsed: number = 0;

    // 初始化ui配置
    public initUIConf(uiConf: { [uiId: number]: CCMIUIConf }) {
        this._uiConf = uiConf;
    }

    // 获取层级根节点
    public getLayerRoot(layerId: CCMUILayerID): cc.Node {
        return this._layerRoot[layerId];
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

    public init() {
        // 初始化层级根节点
        if (0 === this._layerRoot.length) {
            let cvs = cc.find("Canvas");
            for (let i = 0; i < CCMUILayerID.Num; i++) {
                let layerRoot = this._createFullScreenNode(`Layer${i + 1}`);
                cvs.addChild(layerRoot, i + 1);

                this._layerRoot.push(layerRoot);
            }
        }
    }

    /**
     * 添加防触摸层
     * @param layerId 层级id
     * @param zOrder 屏蔽层的层级
     * @param color 防触摸节点颜色
     */
    private _preventTouch(layerId: CCMUILayerID, zOrder: number, color?: cc.Color) {
        let node = cc.instantiate(DefaultKeeper.inst.preventPrefab);
        node.name = `preventTouch_${layerId}_${zOrder}`;
        if (color) {
            node.color = new cc.Color(color.r, color.g, color.b);
            node.opacity = color.a;
        }

        let widget = node.getComponent(cc.Widget);
        widget.target = cc.find("Canvas");
        let layer = this._layerRoot[layerId];
        layer.addChild(node, zOrder);

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
    private _autoLoadRes(uiView: CCMUIView, preLoadProgressCb: ProgressCallback | null, completeCallback: () => void) {
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
    private _getOrCreateUI(uiId: number, progressCallback: ProgressCallback | null, preLoadProgressCb: ProgressCallback | null, completeCallback: (uiView: CCMUIView | null) => void, uiArgs: CCMIUIArgs | null): void {
        // 找到UI配置
        let uiConf = this._uiConf[uiId];
        let uiPath = uiConf.prefabPath;
        if (!uiPath) {
            ccmLog.log(`getOrCreateUI ${uiId} failed, prefab conf not found!`);
            completeCallback(null);
            return;
        }

        let uiView: CCMUIView | null = null;
        resLoader.load(uiConf.bundleName || "resources", uiPath, progressCallback, (err: Error, prefab: any) => {
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
                uiView.cacheAsset(prefab);
                completeCallback(uiView);
            });
        });
    }

    public open(uiId: number, uiArgs: CCMIUIArgs | null = null, progressCallback: ProgressCallback | null = null, preLoadProgressCb: ProgressCallback | null = null): void {
        let uiConf = this._uiConf[uiId];
        if (!uiConf) {
            ccmLog.log(`open ${uiId} failed! not configured`);
            return;
        }

        let uiIndex = this.getUIIndex(uiId);
        if (uiIndex >= 0) {
            // 已在堆栈中，先关闭再打开
            let bRet = this.close(uiId, { aniImmediately: true });
            if (bRet) this.open(uiId, uiArgs, progressCallback);
            return;
        }

        let uiInfo: CCMIUIInfo = {
            uiId: uiId,
            uiArgs: uiArgs,
            uiView: null,
            layerId: uiConf.layerId,
            zOrder: uiConf.zOrder,
            preventNode: null,
        };
        this._uiStack.push(uiInfo);
        this._uiStack.sort(this._sortUIStack);

        if (uiConf.preventTouch) {
            // 添加防触摸层
            uiInfo.preventNode = this._preventTouch(uiConf.layerId, uiConf.zOrder, uiConf.preventColor);
        }

        this._getOrCreateUI(uiId, progressCallback, preLoadProgressCb, (uiView: CCMUIView | null) => {
            if (uiInfo.isClose || !uiView) {
                ccmLog.log(`getOrCreateUI ${uiId} failed! close state : ${uiInfo.isClose} , uiView : ${uiView}`);

                let uiIndex = this.getUIIndex(uiId);
                if (uiIndex >= 0) {
                    // 创建失败，从堆栈删除
                    this._uiStack.splice(uiIndex, 1);
                }
                if (uiInfo.preventNode) {
                    uiInfo.preventNode.destroy();
                    uiInfo.preventNode = null;
                }

                uiView?.node.destroy();

                return;
            }

            this._onUIOpen(uiId, uiView, uiInfo, uiArgs);
        }, uiArgs);
    }

    /**
     * UI被打开时回调，对UI进行初始化设置，刷新其他界面的显示，并根据
     * @param uiId 哪个界面被打开了
     * @param uiView 界面对象
     * @param uiInfo 界面栈对应的信息结构
     * @param uiArgs 界面初始化参数
     */
    private _onUIOpen(uiId: number, uiView: CCMUIView, uiInfo: CCMIUIInfo, uiArgs: CCMIUIArgs | null) {
        if (!uiView) return;

        uiInfo.uiView = uiView;
        uiView.node.zIndex = uiInfo.zOrder;
        uiView.node.parent = this._layerRoot[uiInfo.layerId];
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
                let aniComponent = uiView.node.getComponent(CCMUIAnimation);
                if (aniComponent && aniComponent.curAniName != CCMUIAniName.UINone) return;   // 正在播放动画，不响应
                this.close(uiView, uiInfo.uiArgs);
            }, backGround);
        }

        // 从哪个界面打开的
        let fromUIID: number = -1 || uiArgs?.openFromUIID;
        uiView.onOpen(fromUIID, uiArgs);
        this._autoExecAnimation(uiView, CCMUIAniName.UIOpen, (...args: any[]) => {
            // 动画播放完成回调
            uiView.onOpenAniOver();
        }, uiArgs?.aniImmediately);
    }

    // 关闭指定界面
    public close(uiOrId: CCMUIView | number, uiArgs: CCMIUIArgs | null = null, noCache: boolean = false) {
        let uiIndex = this.getUIIndex(uiOrId);
        if (uiIndex < 0) {
            if ('number' == typeof uiOrId) {
                ccmLog.log(`close ${uiOrId} failed! not found`);
            } else {
                ccmLog.log(`close ${uiOrId.uiId} failed! not found`);
            }
            return false;
        }

        let uiInfo = this._uiStack[uiIndex];
        let uiView = uiInfo.uiView;
        if (!uiView) return false;

        let aniComponent = uiView.node.getComponent(CCMUIAnimation);
        if (aniComponent && aniComponent.curAniName != CCMUIAniName.UINone) return false;   // 正在播放动画，不响应

        uiInfo.isClose = true;
        if (uiInfo.preventNode) {
            uiInfo.preventNode.destroy();
            uiInfo.preventNode = null;
        }
        this._uiStack.splice(uiIndex, 1);

        this._autoExecAnimation(uiView, CCMUIAniName.UIClose, (...args: any[]) => {
            // 动画播放完成回调
            let preUIView = this.getTopShowUI();
            if (preUIView) {
                preUIView.onTop(uiView.uiId, uiView.onClose());
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
        }, uiArgs?.aniImmediately);

        return true;
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
        let uiIndex = this.getUIIndex(uiOrId);
        if (uiIndex < 0) {
            if ('number' == typeof uiOrId) {
                ccmLog.log(`hide ${uiOrId} failed! not found`);
            } else {
                ccmLog.log(`hide ${uiOrId.uiId} failed! not found`);
            }
            return;
        }

        let uiInfo = this._uiStack[uiIndex];
        let uiView = uiInfo.uiView;
        if (uiView) {
            let aniComponent = uiView!.node.getComponent(CCMUIAnimation);
            if (aniComponent && aniComponent.curAniName != CCMUIAniName.UINone) return;   // 正在播放动画，不响应

            uiView.node.active = false;
            if (uiInfo.preventNode) uiInfo.preventNode.active = false;
        }
    }

    // 显示界面
    public show(uiOrId: CCMUIView | number) {
        let uiIndex = this.getUIIndex(uiOrId);
        if (uiIndex < 0) {
            if ('number' == typeof uiOrId) {
                ccmLog.log(`show ${uiOrId} failed! not found`);
            } else {
                ccmLog.log(`show ${uiOrId.uiId} failed! not found`);
            }
            return;
        }

        let uiInfo = this._uiStack[uiIndex];
        let uiView = uiInfo.uiView;
        if (uiView) {
            let aniComponent = uiView!.node.getComponent(CCMUIAnimation);
            if (aniComponent && aniComponent.curAniName != CCMUIAniName.UINone) return;   // 正在播放动画，不响应

            uiView.node.active = true;
            if (uiInfo.preventNode) uiInfo.preventNode.active = true;
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
                if (cc.isValid(uiView) && uiView.cacheTime > 0) {
                    if (curTimestamp - uiView.cachedTS >= uiView.cacheTime) {
                        // 缓存过期，销毁界面
                        uiView.destroy();
                        toDelete.push(uiView);
                    }
                }
            });

            toDelete.forEach(uiView => {
                this._uiCache.delete(uiView);
            });
        }

    }

    // 获取堆栈中的UI
    public getUI(uiId: number): CCMUIView | null {
        for (let i = 0; i < this._uiStack.length; i++) {
            if (this._uiStack[i].uiId == uiId) {
                return this._uiStack[i].uiView;
            }
        }

        return null;
    }

    // 获取堆栈中的UI索引
    public getUIIndex(uiOrId: CCMUIView | number): number {
        if ('number' == typeof uiOrId) {
            for (let i = 0; i < this._uiStack.length; i++) {
                if (this._uiStack[i].uiId == uiOrId) {
                    return i;
                }
            }
        } else {
            for (let i = 0; i < this._uiStack.length; i++) {
                if (this._uiStack[i].uiView === uiOrId) {
                    return i;
                }
            }
        }

        return -1;
    }

    // ui是否正在显示
    public isShowing(uiOrId: CCMUIView | number): boolean {
        let uiIndex = this.getUIIndex(uiOrId);
        if (uiIndex < 0) {
            return false;
        }

        return this._uiStack[uiIndex].uiView!.node.active;
    }

    // 获取栈顶显示UI
    public getTopShowUI(): CCMUIView | null {
        if (this._uiStack.length > 0) {
            for (let i = this._uiStack.length - 1; i >= 0; i--) {
                let uiInfo = this._uiStack[i];
                if (uiInfo.uiView?.node.active) {
                    return uiInfo.uiView!;
                }
            }
        }

        return null;
    }

    // 是否栈顶显示UI
    public isTopShowUI(uiOrId: CCMUIView | number): boolean {
        let uiIndex = this.getUIIndex(uiOrId);
        if (uiIndex < 0) {
            return false;
        }

        if (this._uiStack.length > 0) {
            for (let i = this._uiStack.length - 1; i > uiIndex; i--) {
                let uiInfo = this._uiStack[i];
                if (uiInfo.uiView?.node.active) {
                    return false;
                }
            }
        }

        return true;
    }
}

export const uiMgr = CCMUIManager.inst;