// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import protobuf = require("protobufjs");
import Long = require("long");
import { CCMLanguageType, i18nMgr } from "./base/i18n/CCMI18nManager";
import { CCMIDialogOptions } from "./base/ui/CCMDialogView";
import { tipsMgr } from "./base/ui/CCMTipsManager";
import { uiMgr } from "./base/ui/CCMUIManager";
import { ccmLog } from "./base/utils/CCMLog";
import { UIID } from "./game/config/UIConfig";
import { MSG2 } from "./game/proto/BuffProto";
import CCMCryptoUtil from "./base/utils/CCMCryptoUtil";

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
        switch (customData) {
            case "root1":
                uiMgr.open(UIID.ROOT1, null, () => { uiMgr.open(UIID.ROOT2); });
                break;
            case "root2":
                uiMgr.open(UIID.ROOT2);
                break;
            default:
                break;
        }
    }

    closeUI(event: cc.Event.EventTouch, customData: string) {
        switch (customData) {
            case "root1":
                uiMgr.close(UIID.ROOT1, null, () => { uiMgr.close(UIID.ROOT2); });
                break;
            case "root2":
                uiMgr.close(UIID.ROOT2);
                break;
            default:
                break;
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
        if (CCMLanguageType.EN == i18nMgr.languageId) {
            i18nMgr.setLanguage(CCMLanguageType.TH);
        } else {
            i18nMgr.setLanguage(CCMLanguageType.EN);
        }
    }

    test() {
        let msg = MSG2.create({ type: 1, msg: "hello world" });
        let buffer = MSG2.encode(msg).finish();
        let decodedMsg = MSG2.decode(buffer);
        ccmLog.log("msg: ", msg);
        ccmLog.log("buffer: ", buffer);
        ccmLog.log("decodedMsg: ", decodedMsg);


        let encode = CCMCryptoUtil.base64_encode("中文&english");
        let decode = CCMCryptoUtil.base64_decode(encode);
        ccmLog.log("encode: ", encode);
        ccmLog.log("decode: ", decode);

        encode = CCMCryptoUtil.xxtea_encryptToBase64("123abc", "BIGWIN@888!");    // 6U439K1lkb5KJYD4
        decode = CCMCryptoUtil.xxtea_decryptFromBase64(encode, "BIGWIN@888!");
        ccmLog.log("encode: ", encode);
        ccmLog.log("decode: ", decode);
    }

    releaseAll() {
        cc.assetManager.releaseAll();
    }
}
