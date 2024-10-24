import { AssetType, CompleteCallback, ProgressCallback, resLoader } from "./CCMResLoader";
import Asset = cc.Asset;
import Component = cc.Component;
import _decorator = cc._decorator;
import { CCMResCacheArgs, resMgr } from "./CCMResManager";

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

    /**
     * 开始加载资源
     * @param bundle        assetbundle的路径
     * @param url           资源url或url数组
     * @param type          资源类型，默认为null
     * @param onProgess     加载进度回调
     * @param onCompleted   加载完成回调
     */
    public load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public load(...args: any) {
        // 调用加载接口
        resLoader.load.apply(resLoader, args);
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