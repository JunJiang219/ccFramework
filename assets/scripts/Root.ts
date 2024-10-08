// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ccmLog } from "./base/utils/CCMLog";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Root extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        ccmLog.log('root start');
    }

    // update (dt) {}

    onDestroy(): void {
        ccmLog.log('root onDestroy');
    }
}
