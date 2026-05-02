/**
 * ui动画组件
 */

import { _decorator, Component, Node, tween, Tween, Vec3 } from "cc";

// 界面动画名称
export enum CCMUIAniName {
    UINone = "uiNone",          // 无动画
    UIOpen = "uiOpen",          // 界面打开动画
    UIClose = "uiClose",        // 界面关闭动画
}

const { ccclass, property } = _decorator;

@ccclass('CCMUIAnimation')
export class CCMUIAnimation extends Component {

    @property(Node)
    aniNode: Node = null;     // 动画节点

    /**
     * 界面打开动画
     * @param finishCb 动画结束回调
     * @param aniImmediately 动画是否立即完成
     */
    public execAni_uiOpen(finishCb: () => void, aniImmediately?: boolean) {
        let defaultAniNode = this.aniNode || this.node;
        Tween.stopAllByTarget(defaultAniNode);
        if (aniImmediately) {
            defaultAniNode.setScale(1, 1, 1);
            defaultAniNode.active = true;
            finishCb();
        } else {
            defaultAniNode.setScale(0, 0, 0);
            defaultAniNode.active = true;
            tween(defaultAniNode)
                .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: "bounceOut" })
                .call(() => {
                    finishCb();
                })
                .start();
        }
    }

    /**
     * 界面关闭动画
     * @param finishCb 动画结束回调
     * @param aniImmediately 动画是否立即完成
     */
    public execAni_uiClose(finishCb: () => void, aniImmediately?: boolean) {
        let defaultAniNode = this.aniNode || this.node;
        Tween.stopAllByTarget(defaultAniNode);
        if (aniImmediately) {
            defaultAniNode.setScale(0, 0, 0);
            defaultAniNode.active = true;
            finishCb();
        } else {
            defaultAniNode.setScale(1, 1, 1);
            defaultAniNode.active = true;
            tween(defaultAniNode)
                .to(0.5, { scale: new Vec3(0, 0, 0) }, { easing: "elasticIn" })
                .call(() => {
                    finishCb();
                })
                .start();
        }
    }
}
