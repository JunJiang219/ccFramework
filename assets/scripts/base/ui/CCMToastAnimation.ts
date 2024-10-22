/**
 * toast 默认动画组件
 */

import CCMUIAnimation from "./CCMUIAnimation";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMToastAnimation extends CCMUIAnimation {

    public execAni_UIOpen(finishCb: () => void, aniImmediately?: boolean): void {
        let defaultAniNode = this.aniNode || this.node;
        let dsr = cc.view.getDesignResolutionSize();
        let beginPos = cc.v2(0, dsr.height / 2 + 100);
        let endPos = cc.v2(0, dsr.height / 2 - 100);
        cc.Tween.stopAllByTarget(defaultAniNode);
        if (aniImmediately) {
            defaultAniNode.setPosition(endPos.x, endPos.y);
            defaultAniNode.active = true;
            finishCb();
        } else {
            defaultAniNode.setPosition(beginPos.x, beginPos.y);
            defaultAniNode.active = true;
            cc.tween(defaultAniNode)
                .to(0.5, { x: endPos.x, y: endPos.y }, { easing: "bounceOut" })
                .call(() => {
                    finishCb();
                })
                .start();
        }
    }

    public execAni_UIClose(finishCb: () => void, aniImmediately?: boolean): void {
        let defaultAniNode = this.aniNode || this.node;
        let dsr = cc.view.getDesignResolutionSize();
        let beginPos = cc.v2(0, dsr.height / 2 - 100);
        let endPos = cc.v2(0, dsr.height / 2 + 100);
        cc.Tween.stopAllByTarget(defaultAniNode);
        if (aniImmediately) {
            defaultAniNode.setPosition(endPos.x, endPos.y);
            defaultAniNode.active = true;
            finishCb();
        } else {
            defaultAniNode.setPosition(beginPos.x, beginPos.y);
            defaultAniNode.active = true;
            cc.tween(defaultAniNode)
                .to(0.5, { x: endPos.x, y: endPos.y }, { easing: "elasticIn" })
                .call(() => {
                    finishCb();
                })
                .start();
        }
    }
}
