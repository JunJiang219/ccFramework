import { _decorator, Component, Node, SpriteFrame } from 'cc';
import { CCMMarquee } from 'db://assets/baseLib/scripts/CCMComp/CCMMarquee';
import { CCMUIView } from 'db://assets/baseLib/scripts/CCMUI/CCMUIView';
const { ccclass, property } = _decorator;

@ccclass('TestUI')
export class TestUI extends CCMUIView {

    @property(CCMMarquee)
    marquee: CCMMarquee = null;

    @property(SpriteFrame)
    iconFrame: SpriteFrame = null;

    @property(SpriteFrame)
    coinFrame: SpriteFrame = null;

    protected start(): void {
        this.marquee.setItems([
            { type: 'image', spriteFrame: this.iconFrame },            // 等高等比缩放
            { type: 'text',  content: '<b>限时活动</b>快来！' },
            { type: 'image', spriteFrame: this.coinFrame, width: 40, height: 40 }, // 指定尺寸
            { type: 'text',  content: '<color=#ff0>充值送礼</color>' },
        ]);
    }
}


