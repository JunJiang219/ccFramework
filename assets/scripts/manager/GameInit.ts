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
        gameMgr.init();
    }

    start() {

    }

    update(dt: number) {
        gameMgr.update(dt);
    }
}
