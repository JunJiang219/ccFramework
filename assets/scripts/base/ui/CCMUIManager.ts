/**
 * UI管理器
 */

import { ProgressCallback, resLoader } from "../res/CCMResLoader";
import { CCMResCacheArgs, CCMResReleaseTiming } from "../res/CCMResManager";
import CCMUIView, { CCMUIAniName, CCMUILayerID, CCMUIShowType } from "./CCMUIView";

const ASSET_DELAY_RELEASE_TIME = 60; // 资源默认延迟释放时间（单位：秒）
const UI_UPDATE_INTERVAL = 5;        // UI管理器更新间隔（单位：秒）

// UI信息
export interface CCMIUIInfo {
    uiId: number;                           // UI ID
    uiView: CCMUIView | null;               // UI视图
    layerId: CCMUILayerID;                  // 层级id
    zOrder: number;                         // 层级顺序
}

// UI配置
export interface CCMIUIConf {
    bundleName?: string;          // bundle名，不配则取默认值 'resources'
    prefabPath: string;           // UI预制体路径
    layerId: CCMUILayerID;        // 层级id
    zOrder: number;               // 层级顺序
    preventTouch?: boolean;       // 是否阻止触摸事件向下传递
}

const { ccclass, property } = cc._decorator;

@ccclass
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
    // ui缓存（key为uiId，value为uiView）
    private _uiCache: { [uiId: number]: CCMUIView } = {};
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

    public init() {
        // 初始化层级根节点
        if (0 === this._layerRoot.length) {
            let cvs = cc.find("Canvas");
            for (let i = 0; i < CCMUILayerID.Num; i++) {
                let layerRoot = new cc.Node(`@Layer${i}`);
                layerRoot.zIndex = i;
                layerRoot.setPosition(0, 0);
                layerRoot.setContentSize(cvs.width, cvs.height);
                layerRoot.parent = cvs;

                let widget = layerRoot.addComponent(cc.Widget);
                widget.isAlignTop = true;
                widget.isAlignBottom = true;
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.top = 0;
                widget.bottom = 0;
                widget.left = 0;
                widget.right = 0;
                widget.alignMode = cc.Widget.AlignMode.ON_WINDOW_RESIZE;

                this._layerRoot.push(layerRoot);
            }
        }
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
        let hideIndex: number = 0;
        let showIndex: number = this._uiStack.length - 1;

        for (; showIndex >= 0; --showIndex) {
            let mode = this._uiStack[showIndex].uiView!.showType;

            if (CCMUIShowType.UISingle == mode) {
                this._uiStack[showIndex].uiView!.node.active = true;
                break;
            } else if (CCMUIShowType.UIIndependent == mode) {
                continue;
            } else {
                this._uiStack[showIndex].uiView!.node.active = true
            }
        }

        // 隐藏不该显示的UI
        for (; hideIndex < showIndex; ++hideIndex) {
            let uiInfo = this._uiStack[hideIndex];
            if (uiInfo.uiView) {
                let mode = uiInfo.uiView!.showType;
                if (CCMUIShowType.UIIndependent == mode) {
                    continue;
                } else {
                    if (uiInfo.uiView!.isOpening || uiInfo.uiView!.isClosing) continue; // 动画中不做隐藏处理
                    this._uiStack[hideIndex].uiView!.node.active = false;
                }
            }

        }
    }

    /**
     * 自动检测动画组件以及特定动画，如存在则播放动画，无论动画是否播放，都执行回调
     * @param aniName 动画名
     * @param aniOverCallback 动画播放完成回调
     */
    private _autoExecAnimation(uiView: CCMUIView, aniName: string, aniOverCallback: (...args: any[]) => void) {
        // 暂时先省略动画播放的逻辑
        switch (aniName) {
            case CCMUIAniName.UIOpen:
                // 播放动画
                uiView.execOpenAni(aniOverCallback);
                break;
            case CCMUIAniName.UIClose:
                // 播放动画
                uiView.execCloseAni(aniOverCallback);
                break;
        }
    }

    /**
     * 自动检测资源预加载组件，如果存在则加载完成后调用completeCallback，否则直接调用
     * @param completeCallback 资源加载完成回调
     */
    private _autoLoadRes(uiView: CCMUIView, completeCallback: () => void) {
        // 暂时先省略
        completeCallback();
    }

    /**
     * 异步加载一个UI的prefab
     * @param uiId 界面id
     * @param progressCallback 加载进度回调
     * @param completeCallback 加载完成回调
     * @param args 初始化参数
     */
    private _getOrCreateUI(uiId: number, progressCallback: ProgressCallback | null, completeCallback: (uiView: CCMUIView | null) => void, ...args: any[]): void {
        // 如果找到缓存对象，则直接返回
        let uiView: CCMUIView | null = this._uiCache[uiId];
        if (uiView) {
            uiView.cachedTS = 0;
            delete this._uiCache[uiId]; // 移出缓存队列
            completeCallback(uiView);
            return;
        }

        // 找到UI配置
        let uiConf = this._uiConf[uiId];
        let uiPath = uiConf.prefabPath;
        if (null == uiPath) {
            console.log(`getOrCreateUI ${uiId} failed, prefab conf not found!`);
            completeCallback(null);
            return;
        }

        resLoader.load(uiConf.bundleName || "resources", uiPath, progressCallback, (err: Error, prefab: any) => {
            if (err) {
                // 加载报错
                console.log(`getOrCreateUI loadRes ${uiId} failed, path: ${uiPath}, error: ${err}`);
                completeCallback(null);
                return;
            }

            // 检查实例化错误
            let uiNode: cc.Node = cc.instantiate(prefab);
            if (null == uiNode) {
                console.log(`getOrCreateUI instantiate ${uiId} failed, path: ${uiPath}`);
                completeCallback(null);
                return;
            }

            // 检查组件获取错误
            uiView = uiNode.getComponent(CCMUIView);
            if (!uiView) {
                console.log(`getOrCreateUI getComponent ${uiId} failed, path: ${uiPath}`);
                uiNode.destroy();
                completeCallback(null);
                return;
            }

            // 异步加载UI预加载的资源
            this._autoLoadRes(uiView, () => {
                uiView.init(uiId, ...args);
                if (uiView.cacheTime > 0) {
                    let cacheArgs: CCMResCacheArgs = {
                        releaseTiming: CCMResReleaseTiming.AfterDestroy,
                        keepTime: ASSET_DELAY_RELEASE_TIME    // 界面销毁后，asset再缓存一定时间
                    };
                    uiView.cacheAsset(prefab, cacheArgs);
                } else {
                    uiView.cacheAsset(prefab);
                }
                completeCallback(uiView);
            });
        });
    }

    public open(uiId: number, progressCallback: ProgressCallback | null = null, ...args: any[]): void {
        let uiConf = this._uiConf[uiId];
        if (!uiConf) {
            console.log(`open ${uiId} failed! not configured`);
            return;
        }

        let index = this.getUIIndex(uiId);
        if (index >= 0) {
            this._closeToUI(uiId, true, ...args);
            return;
        }

        let uiInfo: CCMIUIInfo = {
            uiId: uiId,
            uiView: null,
            layerId: uiConf.layerId,
            zOrder: uiConf.zOrder,
        };
        this._uiStack.push(uiInfo);
        this._uiStack.sort(this._sortUIStack);

        this._getOrCreateUI(uiId, progressCallback, (uiView: CCMUIView | null) => {
            if (!uiView) {
                console.log(`getOrCreateUI ${uiId} failed!`);

                let uiIndex = this.getUIIndex(uiId);
                if (uiIndex >= 0) {
                    // 创建失败，从堆栈删除
                    this._uiStack.splice(uiIndex, 1);
                    this._updateUI();
                }

                return;
            }

            this._onUIOpen(uiId, uiView, uiInfo, ...args);
        }, ...args);
    }

    /**
     * UI被打开时回调，对UI进行初始化设置，刷新其他界面的显示，并根据
     * @param uiId 哪个界面被打开了
     * @param uiView 界面对象
     * @param uiInfo 界面栈对应的信息结构
     * @param args 界面初始化参数
     */
    private _onUIOpen(uiId: number, uiView: CCMUIView, uiInfo: CCMIUIInfo, ...args: any[]) {
        if (!uiView) return;

        uiInfo.uiView = uiView;
        uiView.isOpening = true;
        uiView.node.zIndex = uiInfo.zOrder;
        uiView.node.parent = this._layerRoot[uiInfo.layerId];
        uiView.node.active = true;

        // 动画前刷新其他UI，防止动画bug导致UI显示异常
        this._updateUI();

        // 从哪个界面打开的
        let fromUIID: number = -1;
        if (this._uiStack.length > 1) {
            let index = this._uiStack.length - 1;
            if (this.isTopShowUI(uiView)) {
                index--;
            }

            for (; index >= 0; index--) {
                let tmpUIView = this._uiStack[index].uiView;
                if (!tmpUIView) continue;       // 跳过未加载完成的UI

                if (tmpUIView.showType != CCMUIShowType.UIIndependent) {
                    fromUIID = tmpUIView.uiId;
                    break;
                } else if (tmpUIView.showType == CCMUIShowType.UIIndependent && tmpUIView.node.active) {
                    fromUIID = tmpUIView.uiId;
                    break;
                }
            }
        }

        uiView.onOpen(fromUIID, ...args);
        this._autoExecAnimation(uiView, "uiOpen", (...args: any[]) => {
            // 动画播放完成回调
            uiView.isOpening = false;
            // 动画结束再次刷新
            this._updateUI();
        });
    }

    private _closeToUI(uiId: number, bOpenSelf: boolean = true, ...args: any[]): void {
        let uiIndex = this.getUIIndex(uiId);
        if (uiIndex < 0) {
            console.log(`_closeToUI ${uiId} failed! not found`);
            return;
        }

        let minIndex = bOpenSelf ? uiIndex : uiIndex + 1;       // 需要关闭的最小索引
        for (let i = this._uiStack.length - 1; i >= minIndex; --i) {
            let uiInfo = this._uiStack[i];
            let uiId = uiInfo.uiId;
            let uiView = uiInfo.uiView;

            if (!uiView) continue;
            if (uiView.showType == CCMUIShowType.UIIndependent) continue;

            this._uiStack.splice(i, 1);
            uiView.onClose();
            if (uiView.cacheTime > 0) {
                this._uiCache[uiId] = uiView;
                uiView.cachedTS = Math.floor(Date.now() / 1000);
                uiView.node.removeFromParent();
            } else {
                uiView.cachedTS = 0;
                uiView.node.destroy();
            }
        }

        this._updateUI();
        bOpenSelf && this.open(uiId, null, ...args);
    }

    // 关闭指定界面
    public close(uiOrId: CCMUIView | number, noCache: boolean = false) {
        let uiIndex = this.getUIIndex(uiOrId);
        if (uiIndex < 0) {
            if ('number' == typeof uiOrId) {
                console.log(`close ${uiOrId} failed! not found`);
            } else {
                console.log(`close ${uiOrId.uiId} failed! not found`);
            }
            return;
        }

        let uiInfo = this._uiStack[uiIndex];
        let uiId = uiInfo.uiId;
        let uiView = uiInfo.uiView;
        uiView!.isClosing = true;
        this._uiStack.splice(uiIndex, 1);
        this._updateUI();

        this._autoExecAnimation(uiView, "uiClose", (...args: any[]) => {
            // 动画播放完成回调
            uiView!.isClosing = false;
            let preUIView = this.getTopShowUI();
            if (preUIView) {
                preUIView.onTop(uiView.uiId, uiView.onClose());
            } else {
                uiView.onClose();
            }

            if (noCache) {
                // 立即释放ui、asset
                uiView.cachedTS = 0;
                uiView.releaseAssets(true);
                uiView.node.destroy();
            } else {
                if (uiView.cacheTime > 0) {
                    // 缓存ui、asset
                    this._uiCache[uiId] = uiView;
                    uiView.cachedTS = Math.floor(Date.now() / 1000);
                    uiView.node.removeFromParent();
                } else {
                    // 立即释放ui、asset可能延迟释放
                    uiView.cachedTS = 0;
                    uiView.node.destroy();
                }
            }

            this._updateUI();
        });
    }

    // 关闭所有界面
    public closeAll(noCache: boolean = false, ignoreUIIds?: number[]) {
        // 不播放动画，也不清理缓存
        ignoreUIIds = ignoreUIIds || [];
        let newUIStack: CCMIUIInfo[] = [];
        if (noCache) {
            for (const uiInfo of this._uiStack) {
                if (cc.isValid(uiInfo.uiView)) {
                    if (ignoreUIIds.indexOf(uiInfo.uiId) < 0) {
                        // 不在忽略列表中, 立即释放ui、asset
                        uiInfo.uiView.onClose();
                        uiInfo.uiView.releaseAssets(true);
                        uiInfo.uiView.node.destroy();
                    } else {
                        // 在忽略列表中, 放入新列表
                        newUIStack.push(uiInfo);
                    }
                }
            }
        } else {
            for (const uiInfo of this._uiStack) {
                if (cc.isValid(uiInfo.uiView)) {
                    if (ignoreUIIds.indexOf(uiInfo.uiId) < 0) {
                        // 不在忽略列表中, 立即销毁ui
                        uiInfo.uiView.onClose();
                        uiInfo.uiView.node.destroy();
                    } else {
                        // 在忽略列表中, 放入新列表
                        newUIStack.push(uiInfo);
                    }
                }
            }
        }
        this._uiStack = newUIStack;
    }

    // 清理界面缓存
    public clearCache() {
        for (const key in this._uiCache) {
            let uiView = this._uiCache[key];
            if (cc.isValid(uiView)) {
                uiView.releaseAssets(true);
                uiView.node.destroy();
            }
        }
        this._uiCache = {};
    }

    public update(dt: number) {
        this._updateElapsed += dt;
        if (this._updateElapsed >= UI_UPDATE_INTERVAL) {
            // 每5秒更新一次
            this._updateElapsed = 0;
            let curTimestamp = Math.floor(Date.now() / 1000);
            for (const key in this._uiCache) {
                let uiView = this._uiCache[key];
                if (cc.isValid(uiView) && uiView.cacheTime > 0) {
                    if (curTimestamp - uiView.cachedTS >= uiView.cacheTime) {
                        // 缓存过期，销毁界面
                        uiView.destroy();
                        delete this._uiCache[key];
                    }
                }
            }
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

    // 获取栈顶应显示UI
    public getTopShowUI(): CCMUIView | null {
        if (this._uiStack.length > 0) {
            for (let i = this._uiStack.length - 1; i >= 0; i--) {
                let uiInfo = this._uiStack[i];
                if (uiInfo.uiView!.showType != CCMUIShowType.UIIndependent) {
                    return uiInfo.uiView!;
                } else if (uiInfo.uiView!.showType == CCMUIShowType.UIIndependent && uiInfo.uiView!.node.active) {
                    return uiInfo.uiView!;
                }
            }
        }

        return null;
    }

    // 是否栈顶显示UI
    public isTopShowUI(uiOrId: CCMUIView | number): boolean {
        let uiView: CCMUIView | null = null;
        if ('number' == typeof uiOrId) {
            uiView = this.getUI(uiOrId);
        } else {
            uiView = uiOrId;
        }

        if (this._uiStack.length > 0) {
            for (let i = this._uiStack.length - 1; i >= 0; i--) {
                let uiInfo = this._uiStack[i];
                if (uiInfo.uiView!.showType != CCMUIShowType.UIIndependent) {
                    return (uiView == uiInfo.uiView!);
                } else if (uiInfo.uiView!.showType == CCMUIShowType.UIIndependent && uiInfo.uiView!.node.active) {
                    return (uiView == uiInfo.uiView!);
                }
            }
        }

        return false;
    }

    // 是否栈顶显示UI
    public getPreShowUI(uiOrId: CCMUIView | number): CCMUIView | null {
        let uiIndex = this.getUIIndex(uiOrId);
        if (uiIndex <= 0) { return null; }

        for (let i = uiIndex - 1; i >= 0; i--) {
            let uiInfo = this._uiStack[i];
            if (uiInfo.uiView!.showType != CCMUIShowType.UIIndependent) {
                return uiInfo.uiView!;
            } else if (uiInfo.uiView!.showType == CCMUIShowType.UIIndependent && uiInfo.uiView!.node.active) {
                return uiInfo.uiView!;
            }
        }
    }
}

export const uiMgr = CCMUIManager.inst;