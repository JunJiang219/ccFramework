/**
 * 游戏管理器
 */

import { CCMLanguageType, i18nMgr } from "../../base/i18n/CCMI18nManager";
import { resMgr } from "../../base/res/CCMResManager";
import { tipsMgr } from "../../base/ui/CCMTipsManager";
import { CCMIUIArgs, uiMgr } from "../../base/ui/CCMUIManager";
import { ccmLog } from "../../base/utils/CCMLog";
import CCMUtil from "../../base/utils/CCMUtil";
import { STORAGE_KEY } from "../config/StorageDefine";
import { DialogConfig, ToastConfig, UIConfig, UIID } from "../config/UIConfig";

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
        uiMgr.initUIConf(UIConfig);
        uiMgr.init();
        tipsMgr.initDialogConf(DialogConfig);
        tipsMgr.initToastConf(ToastConfig);

        // 解析url参数
        let url = window.location.href;
        let urlParams = CCMUtil.urlParse(url);

        // 使用 Promise.all 来并行执行多个异步操作
        const [deviceId, languageResult] = await Promise.all([
            CCMUtil.getDeviceId(STORAGE_KEY.USER_DEVICEID),
            i18nMgr.setLanguage(urlParams.lang || CCMLanguageType.EN)
        ]);

        ccmLog.info(`deviceId: ${deviceId}`);
        ccmLog.info(`setLanguage success: ${languageResult.isSuccess}, Current language: ${languageResult.curLang}`);

        // 打开登录界面
        uiMgr.open(UIID.LOGIN_REGISTER);

        return Promise.resolve();
    }

    update(dt: number) {
        uiMgr.update(dt);
        tipsMgr.update(dt);
        resMgr.update(dt);
    }
}
