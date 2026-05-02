/**
 * 资源管理类
 */

import { Asset, isValid } from "cc";
import { CCMResKeeper } from "./CCMResKeeper";

const RES_UPDATE_INTERVAL = 5;          // 资源管理器更新间隔（单位：秒）

// 资源缓存信息
export interface CCMResCacheInfo {
    resCache: Set<Asset>;               // 资源缓存
    delayReleaseTime: number;           // 延迟释放时间(单位：秒), 0表示不延迟释放
    keeperInvalidTS: number;            // keeper 失效时间戳(单位：秒), 0表示未失效
}

// 获取当前时间戳（s）
function getCurTS() {
    return Math.floor(Date.now() / 1000);
}

export class CCMResManager {
    private static _instance: CCMResManager = null;
    private constructor() { }
    public static getInstance(): CCMResManager {
        if (CCMResManager._instance === null) {
            CCMResManager._instance = new CCMResManager();
        }
        return CCMResManager._instance;
    }

    private _resMap: Map<CCMResKeeper, CCMResCacheInfo> = new Map<CCMResKeeper, CCMResCacheInfo>();
    private _updateElapsed: number = 0;

    /**
     * 缓存指定资源
     * @param keeper 资源持有者
     * @param asset 资源对象实例
     */
    public cacheAsset(keeper: CCMResKeeper, asset: Asset): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) {
            cacheInfo = { 
                resCache: new Set<Asset>(),
                delayReleaseTime: keeper.delayReleaseTime || 0,
                keeperInvalidTS: 0,
            };
            this._resMap.set(keeper, cacheInfo);
        }

        const resCache = cacheInfo.resCache;
        if (!resCache.has(asset)) {
            asset.addRef();
            resCache.add(asset);
        }
    }

    // 获取指定 keeper 的缓存信息
    // public getCacheInfo(keeper: CCMResKeeper): CCMResCacheInfo {
    //     const cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
    //     return cacheInfo;
    // }

    // 使指定 keeper 失效（节点销毁时会调用，用户无需关心此方法）
    public invalidateKeeper(keeper: CCMResKeeper): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) return;

        if (!cacheInfo.keeperInvalidTS) cacheInfo.keeperInvalidTS = getCurTS();
    }

    /**
     * 强制释放指定资源列表中的资源，不考虑延迟释放时间
     * @param keeper 资源持有者
     * @param assets 资源列表
     * @returns 
     */
    public releaseSpecifyAssets(keeper: CCMResKeeper, assets: Asset[]): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) return;

        for (const asset of assets) {
            if (cacheInfo.resCache.has(asset)) {
                asset.decRef();
                cacheInfo.resCache.delete(asset);
            }
        }
        
        if (cacheInfo.resCache.size === 0) {
            this._resMap.delete(keeper);
        }
    }

    /**
     * 释放指定 keeper 的全部资源
     * @param keeper 
     * @param force 是否强制释放（强制释放会立即释放所有资源，不考虑延迟释放时间）
     * @returns 
     */
    public releaseKeeperAssets(keeper: CCMResKeeper, force: boolean = false): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) return;

        const doRelease = () => {
            const resCache = cacheInfo.resCache;
            for (const asset of resCache) {
                asset.decRef();
            }
            resCache.clear();
            this._resMap.delete(keeper);
        };

        if (force) {
            doRelease(); 
        } else {
            if (!cacheInfo.keeperInvalidTS) return; // keeper 失效时间戳未设置，不释放资源

            const curTS = getCurTS();
            if (curTS - cacheInfo.keeperInvalidTS < cacheInfo.delayReleaseTime) return; // 未到延迟释放时间，不释放资源

            doRelease();  
        }
    }

    /**
     * 释放所有 keeper 的资源
     * @param ignoreKeepers 忽略的 keeper 列表
     * @param force 是否立即释放
     */
    public releaseAssets(ignoreKeepers?: CCMResKeeper[], force: boolean = false): void {
        for (const [keeper, _] of this._resMap) {
            if (ignoreKeepers && ignoreKeepers.indexOf(keeper) !== -1) continue;
            this.releaseKeeperAssets(keeper, force);
        }
    }

    // 更新资源管理器，释放过期资源
    public update(dt: number) {
        this._updateElapsed += dt;
        if (this._updateElapsed >= RES_UPDATE_INTERVAL) {
            // 每5秒更新一次
            this._updateElapsed = 0;

            for (const [keeper, cacheInfo] of this._resMap) {
                if (!isValid(keeper)) {
                    // keeper 已销毁
                    if (!cacheInfo.keeperInvalidTS) cacheInfo.keeperInvalidTS = getCurTS();
                    this.releaseKeeperAssets(keeper);
                }
            }
        }
    }
}
