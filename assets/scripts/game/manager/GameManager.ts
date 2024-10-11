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
import { LoginRegisterTab } from "../login_register/LoginRegisterView";

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
        const deviceId = await CCMUtil.getDeviceId(STORAGE_KEY.USER_DEVICEID);
        ccmLog.info(`deviceId: ${deviceId}`);
        const languageResult = await i18nMgr.setLanguage(CCMLanguageType.EN);
        ccmLog.info(`setLanguage success: ${languageResult.isSuccess}, Current language: ${languageResult.curLang}`);

        // 打开登录界面
        let uiArgs: CCMIUIArgs = {};
        uiArgs.userOptions = { tabId: LoginRegisterTab.LOGIN };
        uiMgr.open(UIID.LOGIN_REGISTER, uiArgs);

        return Promise.resolve();
    }

    update(dt: number) {
        uiMgr.update(dt);
        tipsMgr.update(dt);
        resMgr.update(dt);
    }
}
