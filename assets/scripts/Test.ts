// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { CCMIDialogOptions } from "./base/ui/CCMDialogView";
import { tipsMgr } from "./base/ui/CCMTipsManager";
import { uiMgr } from "./base/ui/CCMUIManager";
import { ccmLog } from "./base/utils/CCMLog";
import { UIID } from "./config/UIConfig";

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
        uiMgr.open(uiId);

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
        uiMgr.close(uiId, null);
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

    test() {
        uiMgr.open(UIID.ROOT1);
        uiMgr.open(UIID.ROOT2);
        uiMgr.closeAll();
    }

    releaseAll() {
        cc.assetManager.releaseAll();
    }
}
