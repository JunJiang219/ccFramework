// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { CCMLanguageType, i18nMgr } from "./base/i18n/CCMI18nManager";
import { resLoader } from "./base/res/CCMResLoader";
import { CCMResReleaseTiming, resMgr } from "./base/res/CCMResManager";
import { CCMResUtil } from "./base/res/CCMResUtil";
import { CCMIDialogOptions } from "./base/ui/CCMDialogView";
import { tipsMgr } from "./base/ui/CCMTipsManager";
import { uiMgr } from "./base/ui/CCMUIManager";
import { ccmLog } from "./base/utils/CCMLog";
import { UIID } from "./config/UIConfig";
import DefaultKeeper from "./manager/DefaultKeeper";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Test extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    private _cnt: number = 0;

    private _res1: cc.Prefab = null;
    private _res2: cc.Prefab = null;

    start() { }

    dump() {
        ccmLog.log(cc.assetManager.assets);
    }

    // update (dt) {}
    openUI(event: cc.Event.EventTouch, customData: string) {
        let uiId = parseInt(customData);
        if (1 == uiId) {
            uiMgr.open(UIID.ROOT1, { aniImmediately: true });
        } else {
            uiMgr.open(uiId);
        }

        // cc.resources.load("prefabs/root1", (err, res) => {
        //     if (err) {
        //         ccmLog.error(err);
        //         return;
        //     }
        //     let node = cc.instantiate(res);
        //     node.parent = this.node.parent;
        // });
    }

    closeUI(event: cc.Event.EventTouch, customData: string) {
        let uiId = parseInt(customData);
        if (1 == uiId) {
            uiMgr.close(UIID.ROOT1, { aniImmediately: true });
        } else {
            uiMgr.close(uiId, null);
        }
    }

    openDialog(event: cc.Event.EventTouch, customData: string) {
        let options: CCMIDialogOptions = {
            text: `This is dialog ${++this._cnt}`,
        };
        tipsMgr.showDialog(options);
    }

    closeDialog(event: cc.Event.EventTouch, customData: string) {
        tipsMgr.closeAllDialogs();
    }

    openToast(event: cc.Event.EventTouch, customData: string) {
        let options: CCMIDialogOptions = {
            text: `This is toast ${++this._cnt}`,
        };
        tipsMgr.showToast(options);
    }

    closeToast(event: cc.Event.EventTouch, customData: string) {
        tipsMgr.closeAllToasts();
    }

    changeLanguage(event: cc.Event.EventTouch, customData: string) {
        if (CCMLanguageType.EN == i18nMgr.language) {
            i18nMgr.setLanguage(CCMLanguageType.TH);
        } else {
            i18nMgr.setLanguage(CCMLanguageType.EN);
        }
    }

    test() {
        uiMgr.open(UIID.ROOT1);
        uiMgr.open(UIID.ROOT2);
        uiMgr.closeAll();
    }

    releaseAll() {
        cc.assetManager.releaseAll();
    }
}
