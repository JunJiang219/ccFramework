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
    delayTime?: number;                 // asset 延迟多少s释放，仅当 releaseTiming 为 DelayDestroy 时有效
}

// 资源缓存映射
export type CCMResCacheMap = Map<Asset, CCMResCacheArgs>;

// 资源缓存信息
export interface CCMResCacheInfo {
    cacheMap: CCMResCacheMap;           // 资源缓存映射
    keeperInvalidTS?: number;           // keeper 失效时间戳，单位：秒
}

export class CCMResManager {
    private static _instance: CCMResManager = null;
    private constructor() { }
    public static get inst(): CCMResManager {
        if (CCMResManager._instance === null) {
            CCMResManager._instance = new CCMResManager();
        }
        return CCMResManager._instance;
    }

    private _resMap: Map<CCMResKeeper, CCMResCacheInfo> = new Map<CCMResKeeper, CCMResCacheInfo>();
    private _updateElapsed: number = 0;

    // 缓存资源
    public cacheAsset(resKeeper: CCMResKeeper, asset: Asset, args?: CCMResCacheArgs): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(resKeeper);
        if (undefined == cacheInfo) {
            cacheInfo = { cacheMap: new Map<Asset, CCMResCacheArgs>() };
            this._resMap.set(resKeeper, cacheInfo);
        }

        let cacheMap: CCMResCacheMap = cacheInfo.cacheMap;
        if (!cacheMap.has(asset)) {
            asset.addRef();
            if (args) {
                cacheMap.set(asset, args);
            } else {
                cacheMap.set(asset, { releaseTiming: CCMResReleaseTiming.OnDestroy });
            }
        }
    }

    /**
     * 释放指定 keeper 的资源
     * @param resKeeper 
     * @param immediately 是否立即释放
     * @returns 
     */
    public releaseKeeperAssets(resKeeper: CCMResKeeper, immediately: boolean = false): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(resKeeper);
        if (undefined == cacheInfo) return;
        let cacheMap: CCMResCacheMap = cacheInfo.cacheMap;
        if (undefined == cacheMap) return;

        if (immediately) {
            for (const asset of cacheMap.keys()) {
                asset.decRef();
            }
            cacheMap.clear();
            this._resMap.delete(resKeeper);
        } else {
            let curTimestamp = Math.floor(Date.now() / 1000);   // 当前时间戳（s）
            for (const [asset, args] of cacheMap) {
                if (args.releaseTiming == CCMResReleaseTiming.OnDestroy) {
                    asset.decRef();
                    cacheMap.delete(asset);
                } else if (args.releaseTiming == CCMResReleaseTiming.DelayDestroy) {
                    if (!cacheInfo.keeperInvalidTS) continue; // 延迟释放资源，还未请求释放，忽略
                    if (curTimestamp - cacheInfo.keeperInvalidTS >= args.delayTime) {
                        asset.decRef();
                        cacheMap.delete(asset);
                    }
                }
            }

            if (cacheMap.size == 0) {
                this._resMap.delete(resKeeper);
            }
        }
    }

    /**
     * 释放所有 keeper 的资源
     * @param immediately 是否立即释放
     */
    public releaseAssets(immediately: boolean = false): void {
        for (const [resKeeper, cacheInfo] of this._resMap) {
            if (!cc.isValid(resKeeper)) {
                if (!cacheInfo.keeperInvalidTS) {
                    cacheInfo.keeperInvalidTS = Math.floor(Date.now() / 1000);
                }
                this.releaseKeeperAssets(resKeeper, immediately);
            }
        }
    }

    // 更新资源管理器，释放过期资源
    public update(dt: number) {
        this._updateElapsed += dt;
        if (this._updateElapsed >= 5) {
            // 每5秒更新一次
            this._updateElapsed = 0;
            this.releaseAssets();
        }
    }
}

export const resMgr = CCMResManager.inst;
