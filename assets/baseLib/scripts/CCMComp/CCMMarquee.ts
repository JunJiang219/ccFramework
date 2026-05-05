/**
 * CCMMarquee 跑马灯组件
 *
 * 功能：
 * 1. 内容从右向左匀速滚动，支持循环
 * 2. 支持富文本条目：<b> <i> <color> <size> 等标签，以及 <img src="xxx"/>
 * 3. 支持图片条目（SpriteFrame），可与文字混排
 * 4. 支持多个条目顺序排列，统一滚动
 * 5. onLoad 时自动在宿主节点上挂载 Mask
 *
 * 节点结构（自动创建）：
 *   MarqueeNode  (UITransform 固定视口 + Mask + CCMMarquee)
 *     └── _track  (滚动轨道，anchor 左侧)
 *           ├── _item  (RichText 或 Sprite + UITransform)
 *           ├── _item
 *           └── ...
 *
 * 坐标约定：
 *   宿主节点锚点为默认 (0.5, 0.5) 时，右边界 = +W/2，左边界 = -W/2。
 *   本组件自动读取锚点，兼容任意锚点设置。
 *
 * 使用示例：
 *
 *   // 多条目混排
 *   marquee.setItems([
 *     { type: 'image', spriteFrame: iconFrame, width: 32, height: 32 },
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
    /** 显示宽度（像素），缺省按 height 等比缩放 spriteFrame 原始尺寸 */
    width?: number;
    /** 显示高度（像素），缺省取宿主节点高度 */
    height?: number;
}

export type MarqueeItem = MarqueeTextItem | MarqueeImageItem;

/** 内部状态枚举 */
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

    /** 首尾间距：循环时最后一个条目尾部到第一个条目头部的空白（像素） */
    @property({ tooltip: '首尾间距（循环衔接时的空白，单位：像素）' })
    gap: number = 200;

    /** 是否循环滚动 */
    @property({ tooltip: '是否循环滚动' })
    loop: boolean = true;

    /** 富文本行内图片图集，条目内含 <img> 标签时必填 */
    @property({ type: SpriteAtlas, tooltip: '富文本 <img> 图集，含 <img> 标签时必填' })
    imageAtlas: SpriteAtlas = null;

    // ── 内部引用 ──
    private _trackNode: Node = null;

    // ── 运行时状态 ──
    private _state: MarqueeState = MarqueeState.Stopped;
    private _trackWidth: number = 0;

    // ── 视口边界（由宿主节点锚点自动计算） ──
    private _leftBoundary: number = 0;
    private _rightBoundary: number = 0;
    private _viewportHeight: number = 0;

    // ── 生命周期 ──

    protected onLoad(): void {
        this._ensureMask();
        this._buildTrackNode();
        this._calcBoundaries();
    }

    protected update(dt: number): void {
        if (this._state !== MarqueeState.Playing) return;
        if (this._trackWidth <= 0) return;

        const pos = this._trackNode.position;
        let newX = pos.x - this.speed * dt;

        // _track anchor x=0，pos.x 即轨道左边界，pos.x + trackWidth 即右边界
        // 当右边界越过视口左边界时，内容已完全滚出
        if (newX + this._trackWidth < this._leftBoundary) {
            if (this.loop) {
                newX = this._rightBoundary + this.gap;
            } else {
                this._state = MarqueeState.Stopped;
                return;
            }
        }

        this._trackNode.setPosition(newX, pos.y, pos.z);
    }

    // ── 公开 API ──

    /**
     * 设置多个滚动条目（文字与图片可任意混合），自动重置并播放
     * @param items 条目数组，按顺序从左到右排列滚动
     */
    public setItems(items: MarqueeItem[]): void {
        this._state = MarqueeState.Stopped;
        this._clearTrack();

        for (const item of items) {
            this._trackNode.addChild(this._createItemNode(item));
        }

        // RichText 需要 1 帧完成排版，延迟后统一量宽并播放
        this.scheduleOnce(() => {
            this._layoutTrack();
            this._resetPosition();
            this.play();
        }, 0);
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

    /** 停止并复位到初始位置 */
    public stop(): void {
        this._state = MarqueeState.Stopped;
        this._resetPosition();
    }

    // ── 私有方法 ──

    /** 宿主节点上若缺少 Mask 则自动添加 */
    private _ensureMask(): void {
        if (!this.node.getComponent(Mask)) {
            const mask = this.node.addComponent(Mask);
            mask.type = MaskType.GRAPHICS_RECT;
        }
    }

    /** 创建（或复用）滚动轨道节点 */
    private _buildTrackNode(): void {
        this._trackNode = this.node.getChildByName('_track');
        if (!this._trackNode) {
            this._trackNode = new Node('_track');
            this._trackNode.layer = Layers.Enum.DEFAULT;
            const uit = this._trackNode.addComponent(UITransform);
            uit.anchorPoint.set(0, 0.5);
            this.node.addChild(this._trackNode);
        }
    }

    /**
     * 根据宿主节点的宽度与锚点，计算本地坐标系下的左右边界。
     * 兼容任意锚点（默认 0.5：右=+W/2，左=-W/2；锚点 0：右=+W，左=0）
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

    /** 根据条目类型创建对应的子节点 */
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
            // 根据目标高度等比计算宽度（若未指定宽度）
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

            uit.setContentSize(targetW, targetH);
        }

        return node;
    }

    /** 销毁轨道内所有条目节点并重置宽度 */
    private _clearTrack(): void {
        const children = [...this._trackNode.children];
        for (const child of children) {
            child.destroy();
        }
        this._trackWidth = 0;
    }

    /**
     * 按顺序摆放各条目节点，计算总轨道宽度。
     * 需在 scheduleOnce 延迟 1 帧后调用，确保 RichText 完成排版。
     */
    private _layoutTrack(): void {
        let x = 0;
        const children = this._trackNode.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            child.setPosition(x, 0, 0);
            const w = child.getComponent(UITransform)?.contentSize.width ?? 0;
            // 最后一个条目后面不加 gap
            x += w + (i < children.length - 1 ? this.gap : 0);
        }
        this._trackWidth = x;
    }

    /** 将轨道复位到视口右边界外等待滚入 */
    private _resetPosition(): void {
        if (!this._trackNode) return;
        this._trackNode.setPosition(new Vec3(this._rightBoundary, 0, 0));
    }
}
