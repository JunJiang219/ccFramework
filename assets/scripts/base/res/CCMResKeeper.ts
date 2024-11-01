import { resLoader } from "./CCMResLoader";
import Asset = cc.Asset;
import Component = cc.Component;
import _decorator = cc._decorator;
import { CCMResCacheArgs, resMgr } from "./CCMResManager";
import { AssetType, CCMResUtil, CompleteCallback, IRemoteOptions, ProgressCallback } from "./CCMResUtil";

/**
 * 资源引用类
 * 1. 提供加载功能，并记录加载过的资源
 * 2. 在node释放时自动清理加载过的资源
 * 3. 支持手动添加记录
 * 
 * 2019-12-13 by 宝爷
 */
const { ccclass } = _decorator;

@ccclass
export class CCMResKeeper extends Component {

    // 是否持有手动延迟释放的资源（只要缓存过，就赋值为true）
    public hasManualDelayRes: boolean = false;

    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(): void {
        let args = CCMResUtil.makeLoadResArgs.apply(this, arguments as any);
        args!.keeper = this;
        resLoader.load(args as any);
    }

    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(): void {
        let args = CCMResUtil.makeLoadResArgs.apply(this, arguments as any);
        args!.keeper = this;
        resLoader.loadDir(args as any);
    }

    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(): void {
        let args = CCMResUtil.makeLoadRemoteArgs.apply(this, arguments as any);
        args!.keeper = this;
        resLoader.loadRemote(args as any);
    }

    /**
     * 缓存资源
     * @param asset 
     * @param args 
     */
    public cacheAsset(asset: Asset, args?: CCMResCacheArgs) {
        resMgr.cacheAsset(this, asset, args);
    }

    /**
     * 取消缓存资源（只对 ManualDelay 有效）
     * @param asset 
     */
    public unCacheAsset(asset: Asset) {
        resMgr.unCacheAsset(this, asset);
    }

    /**
     * 组件销毁时自动释放所有keep的资源
     */
    protected onDestroy() {
        resMgr.invalidateKeeper(this);
        this.releaseAssets(false);
    }

    /**
     * 手动释放资源
     * @param immediately 是否立即释放资源
     */
    public releaseAssets(immediately: boolean = false) {
        resMgr.releaseKeeperAssets(this, immediately);
    }
}