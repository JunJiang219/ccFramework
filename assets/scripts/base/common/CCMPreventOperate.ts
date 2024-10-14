/**
 * 防止操作类
 */

import CCMDefaultKeeper from "../res/CCMDefaultKeeper";
import { uiMgr } from "../ui/CCMUIManager";
import { CCMUILayerID } from "../ui/CCMUIView";

export class CCMPreventOperate {

    private static instance: CCMPreventOperate = null;
    private constructor() { }
    public static get inst(): CCMPreventOperate {
        if (!CCMPreventOperate.instance) {
            CCMPreventOperate.instance = new CCMPreventOperate();
        }
        return CCMPreventOperate.instance;
    }

    protected preventNode: cc.Node = null;
    protected preventCnt: number = 0;
    protected bgNode: cc.Node = null;
    protected badNetNode: cc.Node = null;
    protected badNetTimer: any = null;
    protected badNetTime: number = 3000;     // 网络不好时长(毫秒)
    public init() {
        this.preventNode = cc.instantiate(CCMDefaultKeeper.inst.preventOperatePrefab);
        this.preventNode.parent = uiMgr.getLayerRoot(CCMUILayerID.UI);
        this.preventNode.zIndex = Infinity;
        this.bgNode = this.preventNode.getChildByName("bg");
        this.badNetNode = this.preventNode.getChildByName("badNet");

        this.preventNode.on(cc.Node.EventType.TOUCH_START, function (event: cc.Event.EventCustom) {
            event.stopPropagation();
        }, this.preventNode);

        this.enableOperate(true);
    }

    // 防止操作
    public disableOperate() {
        if (!this.preventNode) return;
        ++this.preventCnt;
        if (this.preventCnt > 0) {
            if (!this.preventNode.active) this.preventNode.active = true;

            this.clearTimer();
            this.hideBadNet();
            this.badNetTimer = setTimeout(() => {
                this.showBadNet();
            }, this.badNetTime);
        }
    }

    // 允许操作
    public enableOperate(force: boolean = false) {
        force ? this.preventCnt = 0 : --this.preventCnt;
        if (this.preventCnt <= 0 && this.preventNode.active) {
            this.preventCnt = 0;
            this.clearTimer();
            this.hideBadNet();
            this.preventNode.active = false;
        }
    }

    protected showBadNet() {
        this.setBgColor(0, 0, 0, 128);
        this.badNetNode.active = true;
        cc.tween(this.badNetNode)
            .by(2, { angle: -360 })
            .repeatForever()
            .start();
    }

    protected hideBadNet() {
        this.setBgColor(0, 0, 0, 0);
        cc.Tween.stopAllByTarget(this.badNetNode);
        this.badNetNode.active = false;
    }

    protected setBgColor(r: number, g: number, b: number, a: number) {
        this.bgNode.color = cc.color(r, g, b);
        this.bgNode.opacity = a;
    }

    protected clearTimer() {
        if (this.badNetTimer) {
            clearTimeout(this.badNetTimer);
            this.badNetTimer = null;
        }
    }
}

export const preventOperate = CCMPreventOperate.inst;
