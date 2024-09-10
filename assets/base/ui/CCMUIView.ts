/**
 * 界面基础类
 */

import { CCMResKeeper } from "../res/CCMResKeeper";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMUIView extends CCMResKeeper {
    private static _objCnt: number = 0; // 界面实例计数器

    private _uiId: number = 0; // 界面唯一标识符
    public get uiId(): number { return this._uiId; }

    private _objId: number = 0; // 界面实例唯一标识符
    public get objId(): number { return this._objId; }
}
