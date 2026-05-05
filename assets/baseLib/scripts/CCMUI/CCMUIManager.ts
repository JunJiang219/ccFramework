/**
 * UIManager界面管理类
 *
 * 1.打开界面，根据配置自动加载界面、调用初始化、播放打开动画、隐藏其他界面、屏蔽下方界面点击
 * 2.关闭界面，根据配置自动关闭界面、播放关闭动画、恢复其他界面
 * 3.提供界面缓存功能
 *
 * 2018-8-28 by 宝爷
 */

import { Event, EventTouch, find, instantiate, isValid, Node, Prefab, UITransform, Widget } from "cc";
import CCMLayerManager from "../CCMLayer/CCMLayerManager";
import CCMResLoader from "../CCMRes/CCMResLoader";
import { ProgressCallback } from "../CCMRes/CCMResDefs";
import { CCMUIAnimation, CCMUIAniName } from "./CCMUIAnimation";
import { CCMUIShowType, CCMUIView } from "./CCMUIView";
import CCMLogger from "../CCMLog/CCMLogger";
import CCMSingleton from "../CCMBase/CCMSingleton";

// UI打开参数
export interface CCMUIArgs {
    quiet?: boolean; // 是否静默打开关闭，不执行打开关闭动画
    insertBefore?: number; // 插入到指定uiId位置的前面
    insertAfter?: number; // 插入到指定uiId位置的后面
    [key: string]: any; // 索引签名，允许任意额外的属性
}

/** UI栈结构体 */
export interface CCMUIInfo {
    uiId: number;
    uiView: CCMUIView;
    layerId: number;
    uiArgs?: CCMUIArgs;
    preventNode?: Node;
    isClose?: boolean;
    tmpUiSiblingIndex?: number; // 临时存储的ui节点兄弟节点索引，ui节点异步添加至场景中后设置，添加完后赋值为undefined
}

/** UI配置结构体 */
export interface CCMUIConf {
    prefabPath: string;
    layerId: number;
    preventTouch?: boolean;
    bundleName?: string;
}

/** UI待打开或关闭队列信息结构体 */
export interface CCMUIQueueInfo {
    uiId: number;
    uiArgs: CCMUIArgs;
    progressCallback?: ProgressCallback;
}

// ui栈排序（layer升序 -> siblingIndex升序）
function sortUIStack(uiA: CCMUIInfo, uiB: CCMUIInfo) {
    if (uiA.layerId === uiB.layerId) {
        return uiA.uiView.node.getSiblingIndex() - uiB.uiView.node.getSiblingIndex();
    } else {
        return uiA.layerId - uiB.layerId;
    }
}

export class CCMUIManager extends CCMSingleton {
    protected constructor() { super(); }

    /** 关闭所有界面并清理缓存，重置为初始状态（UI配置和外部委托保持不变） */
    public override reset(): void {
        this.closeAll();
        this.clearCache();
    }

    /** 是否正在关闭UI */
    private isClosing = false;
    /** 是否正在打开UI */
    private isOpening = false;

    /** UI界面缓存（key为UIId，value为UIView节点）*/
    private _uiCache: { [UIId: number]: CCMUIView } = {};
    /** UI界面栈（{UIID + UIView + UIArgs}数组）*/
    private _uiStack: CCMUIInfo[] = [];
    /** UI待打开列表 */
    private _uiOpenQueue: CCMUIQueueInfo[] = [];
    /** UI待关闭列表 */
    private _uiCloseQueue: CCMUIQueueInfo[] = [];
    /** UI配置 */
    private _uiConf: { [key: number]: CCMUIConf } = {};

    /** UI打开前回调 */
    public uiOpenBeforeDelegate: (uiId: number, preUIId: number) => void = null;
    /** UI打开回调 */
    public uiOpenDelegate: (uiId: number, preUIId: number) => void = null;
    /** UI关闭回调 */
    public uiCloseDelegate: (uiId: number) => void = null;

    /**
     * 初始化所有UI的配置对象
     * @param conf 配置对象
     */
    public initUIConf(conf: { [key: number]: CCMUIConf }): void {
        this._uiConf = conf;
    }

    /**
     * 合并传入的UI配置对象到现有配置中。
     * 注意：此方式为浅拷贝（使用展开操作符），如果conf中的uiId重复，会直接覆盖原有数据。
     * 如果conf对象和原有的 _uiConf 都是普通对象，并且没有原型链、getter/setter或嵌套对象等特殊情况，那么此操作会得到正确的结果。
     * 但如果涉及到深层嵌套等情况，展开操作符进行的是浅合并，嵌套对象会被引用赋值，需根据实际需求决定是否需要深拷贝。
     */
    public mergeUIConf(conf: { [key: number]: CCMUIConf }): void {
        this._uiConf = { ...this._uiConf, ...conf };
    }

    /**
     * 设置或覆盖某uiId的配置
     * @param uiId 要设置的界面id
     * @param conf 要设置的配置
     */
    public setUIConf(uiId: number, conf: CCMUIConf): void {
        this._uiConf[uiId] = conf;
    }

    /****************** 私有方法，UIManager内部的功能和基础规则 *******************/

    // 创建全屏节点
    private createFullScreenNode(nodeName?: string, parentNode?: Node): Node {
        let node = new Node();
        if (nodeName) node.name = nodeName;
        if (parentNode) node.parent = parentNode; // 注意：3.8中不赋值父节点添加widget会报错
        let cvs = find("Canvas");
        let cvs_transform = cvs.getComponent(UITransform);
        let node_transform = node.addComponent(UITransform);
        node_transform.setContentSize(cvs_transform.width, cvs_transform.height);
        this.addWidget(node, cvs);
        return node;
    }

    private addWidget(node: Node, target: Node) {
        let widget = node.addComponent(Widget);
        widget.target = target;
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
        widget.alignMode = Widget.AlignMode.ALWAYS;
    }

    /**
     * 添加防触摸层
     * @param layerId 层级id
     * @param siblingIndex 屏蔽层的兄弟节点索引（从0开始）
     * @param uiId 界面id
     */
    private preventTouch(layerId: number, siblingIndex: number, uiId: number) {
        let parentNode = CCMLayerManager.getInstance().getLayer(layerId);
        let node = this.createFullScreenNode(`preventTouch_${layerId}_${uiId}`, parentNode);
        node.setSiblingIndex(siblingIndex);

        node.on(
            Node.EventType.TOUCH_START,
            function (event: EventTouch) {
                event.propagationStopped = true;
            },
            node,
        );

        return node;
    }

    /** 自动执行下一个待关闭或待打开的界面 */
    private autoExecNextUI() {
        // 逻辑上是先关后开
        if (this._uiCloseQueue.length > 0) {
            let uiQueueInfo = this._uiCloseQueue[0];
            this._uiCloseQueue.splice(0, 1);
            this.close(uiQueueInfo.uiId, uiQueueInfo.uiArgs);
        } else if (this._uiOpenQueue.length > 0) {
            let uiQueueInfo = this._uiOpenQueue[0];
            this._uiOpenQueue.splice(0, 1);
            this.open(uiQueueInfo.uiId, uiQueueInfo.uiArgs, uiQueueInfo.progressCallback);
        }
    }

    /**
     * 自动检测动画组件以及特定动画，如存在则播放动画，无论动画是否播放，都执行回调
     * @param aniName 动画名
     * @param aniOverCallback 动画播放完成回调
     */
    private autoExecAnimation(uiView: CCMUIView, aniName: string, aniOverCallback: () => void, aniImmediately?: boolean) {
        // 暂时先省略动画播放的逻辑
        let aniComp = uiView.node.getComponent(CCMUIAnimation);
        if (aniComp) {
            switch (aniName) {
                case CCMUIAniName.UIOpen:
                    aniComp.execAni_uiOpen(aniOverCallback, aniImmediately);
                    break;
                case CCMUIAniName.UIClose:
                    aniComp.execAni_uiClose(aniOverCallback, aniImmediately);
                    break;
                default:
                    aniOverCallback();
                    break;
            }
        } else {
            aniOverCallback();
        }
    }

    /**
     * 自动检测资源预加载组件，如果存在则加载完成后调用completeCallback，否则直接调用
     * @param completeCallback 资源加载完成回调
     */
    private autoLoadRes(uiView: CCMUIView, completeCallback: () => void) {
        // 暂时先省略
        completeCallback();
    }

    /** 根据界面显示类型刷新显示 */
    private updateUI() {
        let showIndex: number = this._uiStack.length - 1;
        for (; showIndex >= 0; --showIndex) {
            const uiView = this._uiStack[showIndex].uiView;
            if (!uiView) continue;

            if (CCMUIShowType.UISingle == uiView.showType) {
                uiView.node.active = true; // 显示UI
                break;
            } else if (CCMUIShowType.UIAddition == uiView.showType) {
                uiView.node.active = true; // 显示UI
            } else if (CCMUIShowType.UIIndependent == uiView.showType) {
                // do nothing
            }
        }

        // 隐藏不应该显示的部分UI
        for (let hideIndex = 0; hideIndex < showIndex; ++hideIndex) {
            const uiView = this._uiStack[hideIndex].uiView;
            if (!uiView) continue;

            if (CCMUIShowType.UIIndependent !== uiView.showType) {
                uiView.node.active = false; // 隐藏UI
            }
        }
    }

    /**
     * 异步加载一个UI的prefab，成功加载了一个prefab之后
     * @param uiId 界面id
     * @param progressCallback 加载进度回调
     * @param completeCallback 加载完成回调
     * @param uiArgs 初始化参数
     */
    private getOrCreateUI(uiId: number, progressCallback: ProgressCallback, completeCallback: (uiView: CCMUIView) => void, uiArgs: CCMUIArgs): void {
        // 如果找到缓存对象，则直接返回
        let uiView: CCMUIView = this._uiCache[uiId];
        if (uiView) {
            this._uiCache[uiId] = null; // 置空缓存
            completeCallback(uiView);
            return;
        }

        // 找到UI配置
        let uiPath = this._uiConf[uiId].prefabPath;
        if (null == uiPath) {
            CCMLogger.getInstance().log(`getOrCreateUI ${uiId} faile, prefab conf not found!`);
            completeCallback(null);
            return;
        }
        let bundleName = this._uiConf[uiId].bundleName || "resources";

        const resLoader = CCMResLoader.getInstance();
        resLoader.load(bundleName, uiPath, progressCallback, (err: Error, prefab: Prefab) => {
            // 检查加载资源错误
            if (err) {
                CCMLogger.getInstance().log(`getOrCreateUI loadRes ${uiId} faile, path: ${uiPath} error: ${err}`);
                completeCallback(null);
                return;
            }
            // 检查实例化错误
            let uiNode: Node = instantiate(prefab);
            if (null == uiNode) {
                CCMLogger.getInstance().log(`getOrCreateUI instantiate ${uiId} faile, path: ${uiPath}`);
                completeCallback(null);
                return;
            }
            // 检查组件获取错误
            uiView = uiNode.getComponent(CCMUIView);
            if (null == uiView) {
                CCMLogger.getInstance().log(`getOrCreateUI getComponent ${uiId} faile, path: ${uiPath}`);
                uiNode.destroy();
                completeCallback(null);
                return;
            }

            // 异步加载UI预加载的资源
            this.autoLoadRes(uiView, () => {
                uiView.init(uiId, uiArgs);
                uiView.cacheAsset(prefab); // 缓存自身预制体
                completeCallback(uiView);
            });
        });
    }

    /**
     * UI被打开时回调，对UI进行初始化设置，刷新其他界面的显示，并根据
     * @param uiId 哪个界面被打开了
     * @param uiView 界面对象
     * @param uiInfo 界面栈对应的信息结构
     * @param uiArgs 界面初始化参数
     */
    private onUIOpen(uiId: number, uiView: CCMUIView, uiInfo: CCMUIInfo, uiArgs: CCMUIArgs) {
        if (null == uiView) {
            return;
        }

        // 激活界面
        const uiSiblingIndex =
            undefined != uiInfo.tmpUiSiblingIndex && uiInfo.tmpUiSiblingIndex >= 0 ? uiInfo.tmpUiSiblingIndex : Number.MAX_SAFE_INTEGER;
        uiInfo.uiView = uiView;
        uiView.node.active = true;
        uiView.node.parent = CCMLayerManager.getInstance().getLayer(uiInfo.layerId);
        uiView.node.setSiblingIndex(uiSiblingIndex);
        uiInfo.tmpUiSiblingIndex = undefined;

        // 更新Widget的对齐
        let widget = uiView.getComponent(Widget);
        if (widget) widget.updateAlignment();

        // 快速关闭界面的设置，绑定界面中的background，实现快速关闭
        if (uiView.quickClose) {
            let backGround = uiView.node.getChildByName("background");
            if (!backGround) {
                backGround = this.createFullScreenNode("background", uiView.node);
                backGround.setSiblingIndex(0);
            }
            backGround.targetOff(backGround);
            backGround.on(
                Node.EventType.TOUCH_END,
                (event: EventTouch) => {
                    event.propagationStopped = true;
                    this.close(uiView);
                },
                backGround,
            );
        }

        // 从那个界面打开的
        let fromUIID = this.getPreShowUIInfo(uiId)?.uiId || 0;

        // 打开界面之前回调
        if (this.uiOpenBeforeDelegate) {
            this.uiOpenBeforeDelegate(uiId, fromUIID);
        }

        // 执行onOpen回调
        uiView.onOpen(uiArgs);
        this.autoExecAnimation(
            uiView,
            CCMUIAniName.UIOpen,
            () => {
                uiView.onOpenAniOver();
                if (this.uiOpenDelegate) {
                    this.uiOpenDelegate(uiId, fromUIID);
                }

                this.isOpening = false;
                // 排序并更新显示
                this._uiStack.sort(sortUIStack);
                this.updateUI();
                // 自动执行下一个界面
                this.autoExecNextUI();
            },
            uiArgs?.quiet,
        );
    }

    /** 打开界面并添加到界面栈中 */
    public open(uiId: number, uiArgs: CCMUIArgs = null, progressCallback: ProgressCallback = null): void {
        const uiConf = this._uiConf[uiId];
        if (null == uiConf) {
            CCMLogger.getInstance().log(`open ${uiId} faile, conf not found!`);
            return;
        }

        if (this.isOpening || this.isClosing) {
            // 插入待打开队列
            const uiQueueInfo: CCMUIQueueInfo = {
                uiId: uiId,
                uiArgs: uiArgs,
                progressCallback: progressCallback,
            };
            this._uiOpenQueue.push(uiQueueInfo);
            return;
        }

        let uiInfo: CCMUIInfo = {
            uiId: uiId,
            uiView: null,
            layerId: uiConf.layerId,
            uiArgs: uiArgs,
        };

        let uiIndex = this.getUIIndex(uiId);
        if (-1 != uiIndex) {
            // 重复打开了同一个界面，先关闭，再打开
            this.close(uiId, { quiet: true });
            this.open(uiId, uiArgs, progressCallback);
            return;
        }

        // 设置UI的zOrder
        let preventSiblingIndex = Number.MAX_SAFE_INTEGER;
        let judgeUIInfo: CCMUIInfo = null;
        if (uiArgs?.insertBefore) {
            judgeUIInfo = this.getUIInfo(uiArgs.insertBefore);
            if (judgeUIInfo) {
                if (judgeUIInfo.preventNode) {
                    // 如果插入位置有屏蔽层，则插入到屏蔽层的前面
                    preventSiblingIndex = judgeUIInfo.preventNode.getSiblingIndex();
                } else if (judgeUIInfo.uiView) {
                    // 如果插入位置没有屏蔽层，则插入到界面的前面
                    preventSiblingIndex = judgeUIInfo.uiView.node.getSiblingIndex();
                }
            }
        } else if (uiArgs?.insertAfter) {
            judgeUIInfo = this.getUIInfo(uiArgs.insertAfter);
            if (judgeUIInfo && judgeUIInfo.uiView) {
                // 插入到界面的后面
                preventSiblingIndex = judgeUIInfo.uiView.node.getSiblingIndex() + 1;
            }
        }
        this._uiStack.push(uiInfo);

        // 先屏蔽点击
        if (this._uiConf[uiId].preventTouch) {
            uiInfo.tmpUiSiblingIndex = Math.min(preventSiblingIndex + 1, Number.MAX_SAFE_INTEGER);
            uiInfo.preventNode = this.preventTouch(uiInfo.layerId, preventSiblingIndex, uiId);
        } else {
            uiInfo.tmpUiSiblingIndex = preventSiblingIndex;
        }

        this.isOpening = true;
        // 预加载资源，并在资源加载完成后自动打开界面
        this.getOrCreateUI(
            uiId,
            progressCallback,
            (uiView: CCMUIView): void => {
                // 如果界面已经被关闭或创建失败
                if (uiInfo.isClose || null == uiView) {
                    CCMLogger.getInstance().log(`getOrCreateUI ${uiId} faile!
                        close state : ${uiInfo.isClose} , uiView : ${uiView}`);
                    this.isOpening = false;
                    if (uiInfo.preventNode) {
                        uiInfo.preventNode.destroy();
                        uiInfo.preventNode = null;
                    }
                    uiView?.node.destroy();

                    // 如果界面已经被关闭或创建失败，则从界面栈中移除
                    let uiIndex = this.getUIIndex(uiId);
                    if (uiIndex != -1) {
                        this._uiStack.splice(uiIndex, 1);
                    }
                    
                    return;
                }

                // 打开UI，执行配置
                this.onUIOpen(uiId, uiView, uiInfo, uiArgs);
            },
            uiArgs,
        );
    }

    /**
     * 关闭界面
     * @param closeUI 要关闭的界面
     */
    public close(uiOrId: CCMUIView | number, uiArgs: CCMUIArgs = null) {
        let uiCount = this._uiStack.length;
        let uiId: number = 0;
        if (typeof uiOrId === "number") {
            uiId = uiOrId;
        } else {
            uiId = uiOrId.uiId;
        }
        if (uiId === 0) {
            CCMLogger.getInstance().log(`close ${uiOrId} faile, uiId not found!`);
            return;
        }

        if (uiCount < 1 || this.isClosing || this.isOpening) {
            // 插入待关闭队列
            const uiQueueInfo: CCMUIQueueInfo = {
                uiId: uiId,
                uiArgs: uiArgs,
            };
            this._uiCloseQueue.push(uiQueueInfo);
            return;
        }

        let uiIndex = this.getUIIndex(uiId);
        if (-1 == uiIndex) {
            return;
        }

        let uiInfo = this._uiStack[uiIndex];
        let preUIInfo = this.getPreShowUIInfo(uiId);
        this._uiStack.splice(uiIndex, 1);

        // 关闭当前界面
        let uiView = uiInfo.uiView;
        uiInfo.isClose = true;

        // 回收遮罩层
        if (uiInfo.preventNode) {
            uiInfo.preventNode.destroy();
            uiInfo.preventNode = null;
        }

        if (null == uiView) {
            return;
        }

        // 处理显示模式
        this.updateUI();
        let close = () => {
            this.isClosing = false;
            // 显示之前的界面
            if (preUIInfo && preUIInfo.uiView && this.isTopUI(preUIInfo.uiId, true)) {
                // 如果之前的界面弹到了最上方（中间有可能打开了其他界面）回调onTop
                preUIInfo.uiView.onTop(uiId, uiView.onClose());
            } else {
                uiView.onClose();
            }

            if (this.uiCloseDelegate) {
                this.uiCloseDelegate(uiId);
            }

            if (uiView.cache) {
                this._uiCache[uiId] = uiView;
                uiView.node.removeFromParent();
                CCMLogger.getInstance().log(`uiView removeFromParent ${uiInfo.uiId}`);
            } else {
                uiView.node.destroy();
                CCMLogger.getInstance().log(`uiView destroy ${uiInfo.uiId}`);
            }
            this.autoExecNextUI();
        };
        // 执行关闭动画
        this.isClosing = true;
        this.autoExecAnimation(uiView, CCMUIAniName.UIClose, close, uiArgs?.quiet);
    }

    /**
     * 关闭所有界面，如果不传ignoreIds则关闭所有界面，如果传了ignoreIds则关闭所有界面，但不关闭ignoreIds列表中的界面
     * @param ignoreIds 忽略关闭的界面id列表
     */
    public closeAll(ignoreIds?: number[]) {
        // 不播放动画，也不清理缓存
        let ignoreStack: CCMUIInfo[] = [];
        for (const uiInfo of this._uiStack) {
            if (ignoreIds && ignoreIds.indexOf(uiInfo.uiId) != -1) {
                ignoreStack.push(uiInfo);
                continue;
            }

            uiInfo.isClose = true;
            if (uiInfo.preventNode) {
                uiInfo.preventNode.destroy();
                uiInfo.preventNode = null;
            }
            if (uiInfo.uiView) {
                uiInfo.uiView.onClose();
                uiInfo.uiView.node.destroy();
            }
        }
        this._uiOpenQueue = [];
        this._uiCloseQueue = [];
        this._uiStack = ignoreStack;
        this.isOpening = false;
        this.isClosing = false;
    }

    /** 清理界面缓存 */
    public clearCache(): void {
        for (const key in this._uiCache) {
            let ui = this._uiCache[key];
            if (isValid(ui.node)) {
                ui.node.destroy();
            }
        }
        this._uiCache = {};
    }

    /******************** UI的便捷接口 *******************/
    /**
     * 判断界面是否在栈顶，如果 inLayer为true 则判断是否在当前层级栈顶
     * @param uiId 界面id
     * @param inSameLayer 是否在uiId的同一层级栈顶
     * @returns
     */
    public isTopUI(uiId: number, inSameLayer: boolean = false): boolean {
        if (this._uiStack.length == 0) {
            return false;
        }

        if (inSameLayer) {
            let uiInfo = this.getUIInfo(uiId);
            if (!uiInfo) return false;

            let topUIInfo = this.getTopUIInfo(uiInfo.layerId);
            if (!topUIInfo) return false;

            return topUIInfo.uiId == uiInfo.uiId;
        } else {
            return this._uiStack[this._uiStack.length - 1].uiId == uiId;
        }
    }

    public getUIInfo(uiId: number): CCMUIInfo {
        for (let index = 0; index < this._uiStack.length; index++) {
            const element = this._uiStack[index];
            if (uiId == element.uiId) {
                return element;
            }
        }
        return null;
    }

    public getPreShowUIInfo(uiId: number): CCMUIInfo {
        let uiIndex = this.getUIIndex(uiId);
        if (uiIndex <= 0) {
            return null;
        }

        for (let index = uiIndex - 1; index >= 0; index--) {
            const element = this._uiStack[index];
            const uiView = element.uiView;
            if (!uiView) continue;

            if (uiView.showType == CCMUIShowType.UIIndependent) {
                if (uiView.node.active) return element;
            } else {
                return element;
            }
        }
        return null;
    }

    /**
     * 获取栈顶界面，如果不传layerId则返回栈顶界面，如果传了layerId则返回该层级id的栈顶界面
     * @param layerId 层级id，如果不传则返回栈顶界面
     * @returns
     */
    public getTopUIInfo(layerId?: number): CCMUIInfo {
        let topUIInfo: CCMUIInfo = null;
        if (undefined == layerId) {
            if (this._uiStack.length > 0) {
                topUIInfo = this._uiStack[this._uiStack.length - 1];
            }
        } else {
            for (let index = this._uiStack.length - 1; index >= 0; index--) {
                const element = this._uiStack[index];
                if (layerId == element.layerId) {
                    topUIInfo = element;
                    break;
                }
            }
        }

        return topUIInfo;
    }

    public getUIIndex(uiId: number): number {
        for (let index = 0; index < this._uiStack.length; index++) {
            const element = this._uiStack[index];
            if (uiId == element.uiId) {
                return index;
            }
        }
        return -1;
    }

    /**
     * 获取界面栈长度，如果不传layerId则返回总长度，如果传了layerId则返回该层级id的界面栈长度
     * @param layerId 层级id，如果不传则返回总长度
     * @returns
     */
    public getUIStackLength(layerId?: number): number {
        if (undefined == layerId) {
            return this._uiStack.length;
        } else {
            let length = 0;
            for (let index = 0; index < this._uiStack.length; index++) {
                const element = this._uiStack[index];
                if (layerId == element.layerId) {
                    length++;
                }
            }
            return length;
        }
    }
}
