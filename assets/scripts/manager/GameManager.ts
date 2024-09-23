/**
 * 游戏管理器
 */

import { resMgr } from "../base/res/CCMResManager";
import { tipsMgr } from "../base/ui/CCMTipsManager";
import { uiMgr } from "../base/ui/CCMUIManager";
import { DialogConfig, ToastConfig, UIConfig } from "../config/UIConfig";

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
        cc.game.addPersistRootNode(this.node);  // 设为常驻节点
        uiMgr.initUIConf(UIConfig);
        uiMgr.init();
        tipsMgr.initDialogConf(DialogConfig);
        tipsMgr.initToastConf(ToastConfig);
    }

    update(dt: number) {
        uiMgr.update(dt);
        tipsMgr.update(dt);
        resMgr.update(dt);
    }
}
