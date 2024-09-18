/**
 * 游戏管理器
 */

import { resMgr } from "../base/res/CCMResManager";
import { uiMgr } from "../base/ui/CCMUIManager";
import { UIConfig } from "../config/UIConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    private static _instance: GameManager;
    public static get inst(): GameManager { return GameManager._instance; }

    onLoad() {
        if (GameManager._instance) return;
        GameManager._instance = this;
        this._init();
    }

    private _init() {
        cc.game.addPersistRootNode(this.node);
        uiMgr.initUIConf(UIConfig);
        uiMgr.init();
    }

    update(dt: number) {
        uiMgr.update(dt);
        resMgr.update(dt);
    }
}
