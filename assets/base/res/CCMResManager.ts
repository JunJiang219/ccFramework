/**
 * 资源管理类
 */

import { CCMResKeeper } from "./CCMResKeeper";
import Asset = cc.Asset;

// 资源释放时机类型
export enum CCMResReleaseTiming {
    OnDestroy,      // 组件销毁时，立即释放
    DelayDestroy,   // 组件销毁时，延迟释放
}

// 资源缓存参数
export interface CCMResCacheArgs {
    releaseTiming: CCMResReleaseTiming; // 资源释放时机类型
    delayTime?: number;                 // 延迟释放时间，单位：秒，仅当 releaseTiming 为 Delay 时有效
    enableDelayTimestamp?: number;      // 资源开始延迟释放时间戳，单位：秒，仅当 releaseTiming 为 Delay 时有效
}

// 资源缓存映射
export type CCMResCacheMap = Map<Asset, CCMResCacheArgs>;

export class CCMResManager {
    private static _instance: CCMResManager = null;
    private constructor() { }
    public static get inst(): CCMResManager {
        if (CCMResManager._instance === null) {
            CCMResManager._instance = new CCMResManager();
        }
        return CCMResManager._instance;
    }

    private _resMap: Map<CCMResKeeper, CCMResCacheMap> = new Map<CCMResKeeper, CCMResCacheMap>();
    private _updateElapsed: number = 0;

    // 缓存资源
    public cacheAsset(resKeeper: CCMResKeeper, asset: Asset, args?: CCMResCacheArgs): void {
        let cacheMap: CCMResCacheMap = this._resMap.get(resKeeper);
        if (undefined == cacheMap) {
            cacheMap = new Map<Asset, CCMResCacheArgs>();
            this._resMap.set(resKeeper, cacheMap);
        }

        if (!cacheMap.has(asset)) {
            asset.addRef();
            if (args) {
                cacheMap.set(asset, args);
            } else {
                cacheMap.set(asset, { releaseTiming: CCMResReleaseTiming.OnDestroy });
            }
        }
    }

    // 激活 keeper 的延迟释放资源
    public enableDelayDestroy(resKeeper: CCMResKeeper): void {
        let cacheMap: CCMResCacheMap = this._resMap.get(resKeeper);
        if (undefined == cacheMap) {
            return;
        }

        let curTimestamp = Math.floor(Date.now() / 1000);   // 当前时间戳（s）
        for (const [asset, args] of cacheMap) {
            if (args.releaseTiming == CCMResReleaseTiming.DelayDestroy && !args.enableDelayTimestamp) {
                args.enableDelayTimestamp = curTimestamp;
            }
        }
    }

    // 释放指定 keeper 的资源
    public releaseKeeperAssets(resKeeper: CCMResKeeper): void {
        let cacheMap: CCMResCacheMap = this._resMap.get(resKeeper);
        if (undefined == cacheMap) {
            return;
        }

        let curTimestamp = Math.floor(Date.now() / 1000);   // 当前时间戳（s）
        for (const [asset, args] of cacheMap) {
            if (args.releaseTiming == CCMResReleaseTiming.OnDestroy) {
                asset.decRef();
                cacheMap.delete(asset);
            } else if (args.releaseTiming == CCMResReleaseTiming.DelayDestroy) {
                if (!args.enableDelayTimestamp) continue; // 延迟释放资源，还未请求释放，忽略
                if (curTimestamp - args.enableDelayTimestamp >= args.delayTime) {
                    asset.decRef();
                    cacheMap.delete(asset);
                }
            }
        }

        if (cacheMap.size == 0) {
            this._resMap.delete(resKeeper);
        }
    }

    // 释放所有 keeper 的资源
    public releaseAssets(): void {
        for (const resKeeper of this._resMap.keys()) {
            if (!cc.isValid(resKeeper)) {
                this.releaseKeeperAssets(resKeeper);
            }
        }
    }

    // 更新资源管理器，释放过期资源
    public update(dt: number) {
        this._updateElapsed += dt;
        if (this._updateElapsed >= 1) {
            // 每秒更新一次
            this._updateElapsed = 0;
            this.releaseAssets();
        }
    }
}

export const resMgr = CCMResManager.inst;
