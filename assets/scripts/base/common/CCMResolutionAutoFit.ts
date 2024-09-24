/**
 * 分辨率自适应
 */

import { ccmLog } from "../utils/CCMLog";

const CHECK_INTERVAL = 0.1;

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMResolutionAutoFit extends cc.Component {

    private _drsBigNum: number = 0;             // 原始设计分辨率的宽高中较大的值
    private _drsSmallNum: number = 0;           // 原始设计分辨率的宽高中较小的值
    private _oldSize: cc.Size = cc.size(0, 0);
    private _updateElapsedTime: number = 0;

    start() {
        let drs = cc.view.getDesignResolutionSize();
        this._drsBigNum = Math.max(drs.width, drs.height);
        this._drsSmallNum = Math.min(drs.width, drs.height);
        this._adjustResolutionPolicy();
    }

    update(dt: number) {
        this._updateElapsedTime += dt;
        if (this._updateElapsedTime < CHECK_INTERVAL) return;
        this._updateElapsedTime = 0;
        this._adjustResolutionPolicy();
    }

    private _adjustResolutionPolicy() {
        let frameSize = cc.view.getFrameSize();
        if (!this._oldSize.equals(frameSize)) {
            let ratio = frameSize.width / frameSize.height;
            let drs: cc.Size = cc.size(0, 0);       // 设计分辨率
            if (frameSize.width > frameSize.height) {
                // 横版
                drs.width = this._drsBigNum;
                drs.height = this._drsSmallNum;
            } else {
                // 竖版
                drs.width = this._drsSmallNum;
                drs.height = this._drsBigNum;
            }
            let drsRatio = drs.width / drs.height;
            ccmLog.log(`frameSize: (${frameSize.width}, ${frameSize.height})`);
            ccmLog.log(`drs: (${drs.width}, ${drs.height})`);

            if (ratio > drsRatio) {
                //wider than design. fixed height
                cc.view.setDesignResolutionSize(drs.width, drs.height, cc.ResolutionPolicy.FIXED_HEIGHT);
                ccmLog.log("wider than design. fixed height");
            }
            else {
                //higher than design. fixed width
                cc.view.setDesignResolutionSize(drs.width, drs.height, cc.ResolutionPolicy.FIXED_WIDTH);
                ccmLog.log("higher than design. fixed width");
            }

            this._oldSize.width = frameSize.width;
            this._oldSize.height = frameSize.height;
        }
    }
}