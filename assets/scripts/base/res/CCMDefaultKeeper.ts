/**
 * 默认的 resKeeper
 */

import { CCMResKeeper } from "./CCMResKeeper";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMDefaultKeeper extends CCMResKeeper {

    private static _instance: CCMDefaultKeeper = null;
    public static get inst() { return CCMDefaultKeeper._instance; }

    @property(cc.SpriteFrame)
    pureWhiteSpf: cc.SpriteFrame = null;

    @property(cc.Prefab)
    preventPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    preventOperatePrefab: cc.Prefab = null;

    onLoad() {
        if (CCMDefaultKeeper._instance) return;
        CCMDefaultKeeper._instance = this;
    }
}
