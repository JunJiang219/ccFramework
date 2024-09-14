/**
 * 游戏初始化脚本
 */

import { gameMgr } from "./GameManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameInit extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        cc.game.addPersistRootNode(this.node);
    }

    start() {
        gameMgr.init();
    }

    update(dt: number) {
        gameMgr.update(dt);
    }
}
