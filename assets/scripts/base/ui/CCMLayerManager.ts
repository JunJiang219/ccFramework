/**
 * 层级管理
 */

// 界面层级id
export enum CCMLayerID {
    Game,           // 游戏界面层级
    UI,             // UI界面层级
    Popup,          // 弹窗层级
    Dialog,         // 对话框层级
    Toast,          // 提示层级
    Loading,        // 加载层级
    Top,            // 置顶层级
    Num,            // 层级数量
}

export class CCMLayerManager {

    private static _instance: CCMLayerManager = null;
    private constructor() { }
    public static get inst(): CCMLayerManager {
        if (null == CCMLayerManager._instance) {
            CCMLayerManager._instance = new CCMLayerManager();
        }
        return CCMLayerManager._instance;
    }

    // 层级根节点
    private _layerRoot: cc.Node[] = [];

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
            for (let i = 0; i < CCMLayerID.Num; ++i) {
                let layerRoot = this._createFullScreenNode(`Layer${i + 1}`);
                cvs.addChild(layerRoot, i + 1);     // zOrder从1开始

                this._layerRoot.push(layerRoot);
            }
        }
    }

    // 获取层级根节点
    public getLayerRoot(layerId: CCMLayerID): cc.Node {
        return this._layerRoot[layerId];
    }
}

export const layerMgr = CCMLayerManager.inst;