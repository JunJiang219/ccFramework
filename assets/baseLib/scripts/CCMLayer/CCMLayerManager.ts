/**
 * 层级管理器
 */

import { BlockInputEvents, find, isValid, Layers, Node, UITransform, Widget } from "cc";
import CCMSingleton from "../CCMBase/CCMSingleton";

// 层级ID，从1开始
export enum CCMLayerID {
    GAME = 1,   // 游戏层。承载核心游戏画面，相当于纯粹的3D/2D游戏世界渲染。此层通常不接受UI事件，专注于游戏本身的视觉表现。
    HUD,        // 信息附着层。紧密附着在游戏层之上的信息提示，是游戏世界信息的抽象延伸。如角色头顶的姓名板、血条、对话气泡、战斗伤害数字
    HUB,        // 常驻界面层。玩家在主要游戏过程中持续可见的操作与信息界面，优先级高于游戏层但应尽可能简洁，避免过度遮挡游戏画面（如虚拟摇杆、技能栏等）
    POPUP,      // 弹窗层。用于打开具体的功能界面或二级菜单
    NOTICE,     // 提示层。用于显示强提示、确认框或系统级通知，拥有较高的中断优先级
    TOPMOST,    // 最高层级，用于显示必须完全不被遮挡的视觉反馈或全局性引导。
    TOPBLOCK,   // 最高拦截层，用于拦截所有事件，防止事件穿透，其下不挂任何节点
}

export default class CCMLayerManager extends CCMSingleton {
    protected constructor() { super(); }
    private _layerMap: Map<number, Node> = new Map();

    /** 销毁所有层级节点并清空映射表 */
    public override reset(): void {
        this._layerMap.forEach(node => {
            if (isValid(node)) node.destroy();
        });
        this._layerMap.clear();
    }


    // 创建全屏节点
    private createFullScreenNode(nodeName?: string): Node {
        let cvs = find("Canvas");
        let cvs_transform = cvs.getComponent(UITransform);

        let node = new Node();
        if (nodeName) node.name = nodeName;
        node.parent = cvs;
        node.layer = Layers.Enum.UI_2D;
        let transform = node.addComponent(UITransform);
        transform.setContentSize(cvs_transform.width, cvs_transform.height);

        this.addWidget(node, node.parent);

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

    // 获取层级节点
    public getLayer(layerId: number): Node {
        if (this._layerMap.has(layerId)) {
            return this._layerMap.get(layerId);
        } else {
            let curLayers = this.getCurLayers();
            let layerIndex = Number.MAX_SAFE_INTEGER;
            for (let i = 0; i < curLayers.length; i++) {
                const tmpLayer = curLayers[i];
                const tmpLayerId = parseInt(tmpLayer.name.split(`layer_`)[1]);
                if (tmpLayerId > layerId) {
                    layerIndex = tmpLayer.getSiblingIndex();
                    break;
                }
            }

            let node = this.createFullScreenNode(`layer_${layerId}`);
            node.setSiblingIndex(layerIndex);
            this._layerMap.set(layerId, node);

            if (layerId === CCMLayerID.TOPBLOCK) {
                node.addComponent(BlockInputEvents);
                node.getComponent(BlockInputEvents).enabled = false;
            }

            return node;
        }
    }

    public enableTopBlock(enable: boolean) {
        let topBlock = this.getLayer(CCMLayerID.TOPBLOCK);
        if (enable) {
            topBlock.getComponent(BlockInputEvents).enabled = true;
        } else {
            topBlock.getComponent(BlockInputEvents).enabled = false;
        }
    }

    protected getCurLayers(): Node[] {
        const cvs = find("Canvas");
        const children = cvs.children;
        let layers: Node[] = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.name.startsWith(`layer_`)) {
                layers.push(child);
            }
        }
        return layers;
    }
}
