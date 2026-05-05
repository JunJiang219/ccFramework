/**
 * CCMMarquee 跑马灯组件
 *
 * 设计原则：MarqueeItem 是最小滚动单元，每个条目作为独立子节点滚动。
 *
 * 功能：
 * 1. 每个条目独立定位，所有条目以相同速度向左滚动
 * 2. 循环模式：某条目完全滚出左边界后，立即放到当前最右端后方继续循环
 * 3. 非循环：条目滚出后销毁，全部销毁后停止
 * 4. 支持富文本条目（RichText 标签 + <img> 行内图片）
 * 5. 支持图片条目（SpriteFrame），可与文字混排
 * 6. onLoad 时自动在宿主节点挂载 Mask
 *
 * 节点结构（自动管理）：
 *   MarqueeNode  (UITransform 固定视口 + Mask + CCMMarquee)
 *     ├── _item  (RichText 或 Sprite，直接挂在 MarqueeNode 下)
 *     ├── _item
 *     └── ...
 *
 * 坐标约定：
 *   宿主节点锚点默认 (0.5, 0.5)：右边界 = +W/2，左边界 = -W/2。
 *   本组件自动读取锚点，兼容任意锚点。
 *
 * 使用示例：
 *   marquee.setItems([
 *     { type: 'text',  content: '<b>公告</b>：欢迎来到游戏！' },
 *     { type: 'image', spriteFrame: iconFrame },
 *     { type: 'text',  content: '<color=#FFD700>限时活动</color> 快来参与！' },
 *   ]);
 */

import {
    _decorator, Component, Layers, Mask, MaskType, Node,
    RichText, Sprite, SpriteAtlas, SpriteFrame, UITransform, Vec3,
} from "cc";

const { ccclass, property } = _decorator;

/** 文字条目 */
export interface MarqueeTextItem {
    type: 'text';
    /** 富文本字符串，支持 Cocos RichText 标签及 <img src="xxx"/> */
    content: string;
}

/** 图片条目 */
export interface MarqueeImageItem {
    type: 'image';
    /** 图片精灵帧 */
    spriteFrame: SpriteFrame;
    /** 显示宽度（像素），缺省按 height 等比缩放 */
    width?: number;
    /** 显示高度（像素），缺省取宿主节点高度 */
    height?: number;
}

export type MarqueeItem = MarqueeTextItem | MarqueeImageItem;

/** 内部运行时条目信息 */
interface MarqueeSlot {
    node: Node;
    width: number;  // 条目渲染宽度（排版后测量）
}

/** 内部状态 */
const enum MarqueeState {
    Stopped,
    Playing,
    Paused,
}

@ccclass('CCMMarquee')
export class CCMMarquee extends Component {

    /** 滚动速度（像素/秒） */
    @property({ tooltip: '滚动速度（像素/秒）' })
    speed: number = 120;

    /** 条目间距：任意相邻两个 MarqueeItem 之间的空白（像素），循环衔接时同样适用 */
    @property({ tooltip: '条目间距（单位：像素）' })
    gap: number = 20;

    /** 是否循环滚动 */
    @property({ tooltip: '是否循环（条目滚出后放回右端继续）' })
    loop: boolean = true;

    /** 富文本行内图片图集，含 <img> 标签时必填 */
    @property({ type: SpriteAtlas, tooltip: '富文本 <img> 图集，含 <img> 标签时必填' })
    imageAtlas: SpriteAtlas = null;

    // ── 内部状态 ──
    private _slots: MarqueeSlot[] = [];
    private _state: MarqueeState = MarqueeState.Stopped;

    // ── 视口边界 ──
    private _leftBoundary: number = 0;
    private _rightBoundary: number = 0;
    private _viewportHeight: number = 0;

    // ── 生命周期 ──

    protected onLoad(): void {
        this._ensureMask();
        this._calcBoundaries();
    }

    protected update(dt: number): void {
        if (this._state !== MarqueeState.Playing) return;
        if (this._slots.length === 0) return;

        const dx = this.speed * dt;

        // 所有条目同步向左移动
        for (const slot of this._slots) {
            const p = slot.node.position;
            slot.node.setPosition(p.x - dx, p.y, p.z);
        }

        // 处理滚出左边界的条目（从后往前遍历，避免 splice 影响索引）
        for (let i = this._slots.length - 1; i >= 0; i--) {
            const slot = this._slots[i];
            if (slot.node.position.x + slot.width >= this._leftBoundary) continue;

            if (this.loop) {
                // 放到当前最右端后方，实现首尾衔接循环
                const maxRight = this._getRightEdge(slot);
                slot.node.setPosition(maxRight + this.gap, 0, 0);
            } else {
                slot.node.destroy();
                this._slots.splice(i, 1);
            }
        }

        if (!this.loop && this._slots.length === 0) {
            this._state = MarqueeState.Stopped;
        }
    }

    // ── 公开 API ──

    /**
     * 设置多个滚动条目（文字与图片可任意混合），自动重置并播放
     */
    public setItems(items: MarqueeItem[]): void {
        this._state = MarqueeState.Stopped;
        this._clearSlots();

        for (const item of items) {
            const node = this._createItemNode(item);
            this.node.addChild(node);
            this._slots.push({ node, width: 0 });
        }

        // RichText 需 1 帧完成排版，延迟后统一量宽、定位、开始播放
        this.scheduleOnce(this._initLayout, 0);
    }

    /** 播放 / 继续滚动 */
    public play(): void {
        this._state = MarqueeState.Playing;
    }

    /** 暂停，保留当前位置 */
    public pause(): void {
        if (this._state === MarqueeState.Playing) {
            this._state = MarqueeState.Paused;
        }
    }

    /** 停止（保留条目当前位置，如需重头播放请重新调用 setItems） */
    public stop(): void {
        this._state = MarqueeState.Stopped;
    }

    // ── 私有：初始化 ──

    /** 宿主节点上若缺少 Mask 则自动添加 */
    private _ensureMask(): void {
        if (!this.node.getComponent(Mask)) {
            const mask = this.node.addComponent(Mask);
            mask.type = MaskType.GRAPHICS_RECT;
        }
    }

    /**
     * 根据宿主节点宽度与锚点，计算本地坐标系下左右边界。
     * 兼容任意锚点（默认 0.5：右=+W/2，左=-W/2；锚点 0：右=W，左=0）
     */
    private _calcBoundaries(): void {
        const uit = this.node.getComponent(UITransform);
        if (!uit) return;
        const { width, height } = uit.contentSize;
        const anchorX = uit.anchorPoint.x;
        this._rightBoundary = width * (1 - anchorX);
        this._leftBoundary  = -width * anchorX;
        this._viewportHeight = height;
    }

    // ── 私有：条目创建 ──

    /** 根据条目类型创建对应节点 */
    private _createItemNode(item: MarqueeItem): Node {
        const node = new Node('_item');
        node.layer = Layers.Enum.DEFAULT;

        if (item.type === 'text') {
            const uit = node.addComponent(UITransform);
            uit.anchorPoint.set(0, 0.5);
            const rt = node.addComponent(RichText);
            rt.maxWidth = 0;
            rt.string = item.content;
            if (this.imageAtlas) rt.imageAtlas = this.imageAtlas;

        } else {
            // 按目标高度等比计算宽度（若未指定）
            const targetH = item.height ?? this._viewportHeight;
            const sf = item.spriteFrame;
            const naturalW = sf?.originalSize.width ?? targetH;
            const naturalH = sf?.originalSize.height ?? targetH;
            const targetW = item.width ?? (naturalH > 0 ? naturalW * (targetH / naturalH) : targetH);

            const uit = node.addComponent(UITransform);
            uit.anchorPoint.set(0, 0.5);

            const sp = node.addComponent(Sprite);
            sp.spriteFrame = sf;
            sp.type = Sprite.Type.SIMPLE;
            sp.sizeMode = Sprite.SizeMode.CUSTOM;

            // 在 Sprite 设置完成后再指定尺寸，避免被 sizeMode 重置
            uit.setContentSize(targetW, targetH);
        }

        return node;
    }

    // ── 私有：布局与清理 ──

    /**
     * 量宽并初始定位：条目从右边界依次向右排开。
     * 作为 scheduleOnce 的回调，确保 RichText 已完成排版。
     */
    private _initLayout = (): void => {
        let x = this._rightBoundary;
        for (const slot of this._slots) {
            slot.width = slot.node.getComponent(UITransform)?.contentSize.width ?? 0;
            slot.node.setPosition(new Vec3(x, 0, 0));
            x += slot.width + this.gap;
        }
        this.play();
    };

    /** 销毁所有条目节点并清空槽列表 */
    private _clearSlots(): void {
        for (const slot of this._slots) {
            slot.node.destroy();
        }
        this._slots = [];
    }

    /**
     * 获取所有条目中最大的右边界（排除指定条目）。
     * 循环模式复位时用于确定新的起始位置。
     */
    private _getRightEdge(excluding: MarqueeSlot): number {
        let max = this._rightBoundary;
        for (const s of this._slots) {
            if (s === excluding) continue;
            max = Math.max(max, s.node.position.x + s.width);
        }
        return max;
    }
}
