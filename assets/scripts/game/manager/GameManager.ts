/**
 * 游戏管理器
 */

import { preventOperate } from "../../base/common/CCMPreventOperate";
import { i18nMgr } from "../../base/i18n/CCMI18nManager";
import { resMgr } from "../../base/res/CCMResManager";
import { layerMgr } from "../../base/ui/CCMLayerManager";
import { uiMgr } from "../../base/ui/CCMUIManager";
import { ccmLog } from "../../base/utils/CCMLog";
import CCMUtil from "../../base/utils/CCMUtil";
import { URL_PARAM } from "../config/HttpDefine";
import { STORAGE_KEY } from "../config/StorageDefine";
import { UIConfig, UIID } from "../config/UIConfig";
import { gameData } from "../data/GameData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    private static _instance: GameManager;
    public static get inst(): GameManager { return GameManager._instance; }

    onLoad() {
        if (GameManager._instance) return;
        GameManager._instance = this;
        this.init();
    }

    private async init() {
        cc.game.addPersistRootNode(this.node);  // 设为常驻节点
        layerMgr.init();
        uiMgr.initUIConf(UIConfig, [UIID.DIALOG], [UIID.TOAST]);
        preventOperate.init();

        // 解析url参数
        let url = window.location.href;
        let urlParams = CCMUtil.urlParse(url);
        let languageId = i18nMgr.languageKey2Id(urlParams[URL_PARAM.LANGUAGE]);

        // 使用 Promise.all 来并行执行多个异步操作
        const [deviceId, languageResult] = await Promise.all([
            CCMUtil.getDeviceId(STORAGE_KEY.USER_DEVICEID),
            i18nMgr.setLanguage(languageId),
        ]);

        gameData.deviceId = deviceId;
        ccmLog.info(`deviceId: ${deviceId}`);
        ccmLog.info(`setLanguage success: ${languageResult.isSuccess}, Current languageId: ${languageResult.curLangId}`);

        // 打开登录界面
        if (cc.director.getScene().name === "entry") {
            uiMgr.open(UIID.LOGIN_REGISTER);
        } else {
            uiMgr.open(UIID.TEST);
        }

        return Promise.resolve();
    }

    update(dt: number) {
        uiMgr.update(dt);
        resMgr.update(dt);
    }
}
