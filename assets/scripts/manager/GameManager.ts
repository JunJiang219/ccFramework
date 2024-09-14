/**
 * 游戏管理器
 */

import { resMgr } from "../base/res/CCMResManager";
import { uiMgr } from "../base/ui/CCMUIManager";
import { UIConfig } from "../config/UIConfig";

export default class GameManager {

    private static _instance: GameManager;
    private constructor() { }
    public static get inst(): GameManager {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }

    public init() {
        uiMgr.initUIConf(UIConfig);
        uiMgr.init();
    }

    public update(dt: number) {
        uiMgr.update(dt);
        resMgr.update(dt);
    }
}

export const gameMgr = GameManager.inst;
