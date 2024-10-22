/**
 * ui动画组件
 */

// 界面动画名称
export enum CCMUIAniName {
    UINone = "uiNone",          // 无动画
    UIOpen = "uiOpen",          // 界面打开动画
    UIClose = "uiClose",        // 界面关闭动画
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMUIAnimation extends cc.Component {

    @property(cc.Node)
    aniNode: cc.Node = null;     // 动画节点

    /**
     * 界面打开动画
     * @param finishCb 动画结束回调
     * @param aniImmediately 动画是否立即完成
     */
    public execAni_UIOpen(finishCb: () => void, aniImmediately?: boolean) {
        let defaultAniNode = this.aniNode || this.node;
        cc.Tween.stopAllByTarget(defaultAniNode);
        if (aniImmediately) {
            defaultAniNode.scale = 1;
            defaultAniNode.active = true;
            finishCb();
        } else {
            defaultAniNode.scale = 0;
            defaultAniNode.active = true;
            cc.tween(defaultAniNode)
                .to(0.5, { scale: 1 }, { easing: "bounceOut" })
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
    public execAni_UIClose(finishCb: () => void, aniImmediately?: boolean) {
        let defaultAniNode = this.aniNode || this.node;
        cc.Tween.stopAllByTarget(defaultAniNode);
        if (aniImmediately) {
            defaultAniNode.scale = 0;
            defaultAniNode.active = true;
            finishCb();
        } else {
            defaultAniNode.scale = 1;
            defaultAniNode.active = true;
            cc.tween(defaultAniNode)
                .to(0.5, { scale: 0 }, { easing: "elasticIn" })
                .call(() => {
                    finishCb();
                })
                .start();
        }
    }
}
