/**
 * ui动画组件
 */

import { ccmLog } from "../utils/CCMLog";

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

    protected _curAniName: string = CCMUIAniName.UINone;    // 当前动画名称
    public get curAniName() { return this._curAniName; }

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
            this._curAniName = CCMUIAniName.UINone;
            finishCb();
        } else {
            defaultAniNode.scale = 0;
            defaultAniNode.active = true;
            this._curAniName = CCMUIAniName.UIOpen;
            cc.tween(defaultAniNode)
                .to(0.5, { scale: 1 }, { easing: "bounceOut" })
                .call(() => {
                    this._curAniName = CCMUIAniName.UINone;
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
            this._curAniName = CCMUIAniName.UINone;
            finishCb();
        } else {
            defaultAniNode.scale = 1;
            defaultAniNode.active = true;
            this._curAniName = CCMUIAniName.UIClose;
            cc.tween(defaultAniNode)
                .to(0.5, { scale: 0 }, { easing: "bounceIn" })
                .call(() => {
                    this._curAniName = CCMUIAniName.UINone;
                    finishCb();
                })
                .start();
        }
    }
}
