/**
 * toast 默认动画组件
 */

import CCMUIAnimation, { CCMUIAniName } from "./CCMUIAnimation";

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
            this._curAniName = CCMUIAniName.UINone;
            finishCb();
        } else {
            defaultAniNode.setPosition(beginPos.x, beginPos.y);
            defaultAniNode.active = true;
            this._curAniName = CCMUIAniName.UIOpen;
            cc.tween(defaultAniNode)
                .to(0.5, { x: endPos.x, y: endPos.y }, { easing: "bounceOut" })
                .call(() => {
                    this._curAniName = CCMUIAniName.UINone;
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
            this._curAniName = CCMUIAniName.UINone;
            finishCb();
        } else {
            defaultAniNode.setPosition(beginPos.x, beginPos.y);
            defaultAniNode.active = true;
            this._curAniName = CCMUIAniName.UIClose;
            cc.tween(defaultAniNode)
                .to(0.5, { x: endPos.x, y: endPos.y }, { easing: "elasticIn" })
                .call(() => {
                    this._curAniName = CCMUIAniName.UINone;
                    finishCb();
                })
                .start();
        }
    }
}
