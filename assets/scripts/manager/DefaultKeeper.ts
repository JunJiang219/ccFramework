/**
 * 默认的 resKeeper
 */

import { CCMResKeeper } from "../base/res/CCMResKeeper";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DefaultKeeper extends CCMResKeeper {

    private static _instance: DefaultKeeper = null;
    public static get inst() { return DefaultKeeper._instance; }

    @property(cc.Prefab)
    preventPrefab: cc.Prefab = null;

    onLoad() {
        if (DefaultKeeper._instance) return;
        DefaultKeeper._instance = this;
    }
}
