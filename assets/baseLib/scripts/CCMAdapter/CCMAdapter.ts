/**
 * 多分辨率屏幕适配器
 * 适配策略必须设定为 cc.ResolutionPolicy.UNKNOWN
 * fitHeight、fitWidth 必须设定为 false（编辑器内不勾选）
 * 
 * view.setResizeCallback(this.onResize.bind(this)); // 监听屏幕尺寸变化
 * 
 * view.on('canvas-resize', this.onResize, this);  // 监听画布尺寸变化，用于多分辨适配
 */

import { find, ResolutionPolicy, screen, size, Size, UITransform, view } from "cc";
import { CCMEventManager } from "../CCMEvent/CCMEventManager";
import { CCMEvent } from "../CCMEvent/CCMEventDefs";
import CCMSingleton from "../CCMBase/CCMSingleton";

// 设备方向
export enum CCMDeviceOrientation {
    LANDSCAPE,
    PORTRAIT ,
    AUTO,
}

export default class CCMAdapter extends CCMSingleton {
    protected constructor() { super(); }

    /** 清空缓存的分辨率数据，下次 resize() 时会重新计算 */
    public override reset(): void {
        this._originalDR = null;
        this._originalDR_bigNum = 0;
        this._originalDR_smallNum = 0;
        this._currentDR = null;
    }

    private _originalDR: Size = null;         // 原始的设计分辨率
    public get originalDR(): Size { return this._originalDR; }
    private _originalDR_bigNum: number = 0;      // 原始的设计分辨率中较大值
    private _originalDR_smallNum: number = 0;    // 原始的设计分辨率中较小值
    private _currentDR: Size = null;         // 当前的设计分辨率
    public get currentDR(): Size { return this._currentDR; }
    public get isLandscape(): boolean { return this._currentDR && this._currentDR.width > this._currentDR.height; }
    private _deviceOrientation: CCMDeviceOrientation = CCMDeviceOrientation.LANDSCAPE;  // 设备方向
    public get deviceOrientation(): CCMDeviceOrientation { return this._deviceOrientation; }
    public set deviceOrientation(value: CCMDeviceOrientation) { this._deviceOrientation = value; }

    public resize() {
        if (!this._originalDR) {
            this._originalDR = view.getDesignResolutionSize();
            this._originalDR_bigNum = Math.max(this._originalDR.width, this._originalDR.height);
            this._originalDR_smallNum = Math.min(this._originalDR.width, this._originalDR.height);
        }

        // const currentFS = view.getFrameSize();                       // 当前屏幕尺寸
        const currentFS = screen.windowSize;                       // 当前屏幕尺寸
        const fsAspectRatio = currentFS.width / currentFS.height;       // 当前屏幕宽高比

        let tmpOriginalDR = this._originalDR;
        if (this._deviceOrientation == CCMDeviceOrientation.LANDSCAPE) {
            // 横屏
            tmpOriginalDR = size(this._originalDR_bigNum, this._originalDR_smallNum);
        } else if (this._deviceOrientation == CCMDeviceOrientation.PORTRAIT) {
            // 竖屏
            tmpOriginalDR = size(this._originalDR_smallNum, this._originalDR_bigNum);
        }else {
            // 自动
            if (fsAspectRatio > 1) {
                // 当前屏幕为横屏
                tmpOriginalDR = size(this._originalDR_bigNum, this._originalDR_smallNum);
            } else {
                // 当前屏幕为竖屏
                tmpOriginalDR = size(this._originalDR_smallNum, this._originalDR_bigNum);
            }
        }
        const drAspectRatio = tmpOriginalDR.width / tmpOriginalDR.height;     // 原始设计分辨率宽高比

        let finalW = currentFS.width;                                   // 最终宽度
        let finalH = currentFS.height;                                  // 最终高度

        if (fsAspectRatio > drAspectRatio) {
            // 当前屏幕宽高比大于原始设计分辨率宽高比，说明当前屏幕宽度更宽，需要按高度适配
            // fitHeight = true;
            // 如果更宽，则用定高适配，

            finalH = tmpOriginalDR.height;
            finalW = finalH * fsAspectRatio;
        } else {
            // 当前屏幕宽高比小于原始设计分辨率宽高比，说明当前屏幕高度更长，需要按宽度适配
            // fitWidth = true;
            // 如果更高，则用定宽适配

            finalW = tmpOriginalDR.width;
            finalH = finalW / fsAspectRatio;
        }

        if (this._currentDR && this._currentDR.width == finalW && this._currentDR.height == finalH) return;    // 分辨率未发生变化，直接返回

        view.setDesignResolutionSize(finalW, finalH, ResolutionPolicy.UNKNOWN);
        let cvs = find("Canvas");
        let cvs_transform = cvs.getComponent(UITransform);
        cvs_transform.width = finalW;
        cvs_transform.height = finalH;
        let isOrientationChanged = (this._currentDR === null);
        let isLandscape_before = this._currentDR && this._currentDR.width > this._currentDR.height;
        this._currentDR = size(finalW, finalH);
        let isLandscape_after = this._currentDR.width > this._currentDR.height;

        if (isOrientationChanged || isLandscape_before != isLandscape_after) {
            CCMEventManager.getInstance().raiseEvent(CCMEvent.RESOLUTION_CHANGE, {resolution: this._currentDR, isOrientationChanged: true, isLandscape: isLandscape_after});
            CCMEventManager.getInstance().raiseEvent(CCMEvent.ORIENTATION_CHANGE, isLandscape_after);
        } else {
            CCMEventManager.getInstance().raiseEvent(CCMEvent.RESOLUTION_CHANGE, {resolution: this._currentDR, isOrientationChanged: false, isLandscape: isLandscape_after});
        }
    }
}

