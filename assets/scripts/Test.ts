// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { uiMgr } from "./base/ui/CCMUIManager";
import { ccmLog } from "./base/utils/CCMLog";
import { UIID } from "./config/UIConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Test extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

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

    releaseAll() {
        cc.assetManager.releaseAll();
    }
}
