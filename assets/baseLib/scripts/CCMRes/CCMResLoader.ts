/**
 * CCMResLoader：封装资源加载接口，隐藏 cc.assetManager 底层差异
 * 1. Promise 化的 load / loadMany / loadDir / loadRemote
 * 2. 自动按需 loadBundle
 * 3. 加载完成后统一处理：泄漏跟踪 + keeper 缓存
 */

import { Asset, assetManager, AssetManager, isValid, resources } from "cc";
import { CCMResLeakChecker } from "./CCMResLeakChecker";
import { ICCMResKeeper, LoadOptions, RemoteLoadOptions } from "./CCMResDefs";
import CCMSingleton from "../CCMBase/CCMSingleton";

/** 默认 bundle 名 */
const DEFAULT_BUNDLE = "resources";

/** bundle 内部加载执行器：拿到 bundle 后由它发起真正的 load 调用 */
type BundleLoader = (bundle: AssetManager.Bundle, onComplete: (err: Error, res: any) => void) => void;

export default class CCMResLoader extends CCMSingleton {

    public resLeakChecker: CCMResLeakChecker = null;
    protected constructor() { super(); }

    /**
     * 加载单个资源
     * @example
     * const prefab = await loader.load<Prefab>('ui/MainView', { bundle: 'ui', keeper: this });
     */
    public load<T extends Asset>(path: string, opts: LoadOptions<T> = {}): Promise<T> {
        return this._loadFromBundle<T>(opts, (bundle, cb) => {
            bundle.load(path, opts.type ?? null, opts.onProgress ?? null, cb);
        });
    }

    /**
     * 加载多个资源
     * @example
     * const sprites = await loader.loadMany<SpriteFrame>(paths, { bundle: 'common' });
     */
    public loadMany<T extends Asset>(paths: string[], opts: LoadOptions<T> = {}): Promise<T[]> {
        return this._loadFromBundle<T[]>(opts, (bundle, cb) => {
            bundle.load(paths, opts.type ?? null, opts.onProgress ?? null, cb);
        });
    }

    /**
     * 加载整个目录
     * @example
     * const audios = await loader.loadDir<AudioClip>('audio', { type: AudioClip, keeper: this });
     */
    public loadDir<T extends Asset>(dir: string, opts: LoadOptions<T> = {}): Promise<T[]> {
        return this._loadFromBundle<T[]>(opts, (bundle, cb) => {
            bundle.loadDir(dir, opts.type ?? null, opts.onProgress ?? null, cb);
        });
    }

    /**
     * 加载远程资源
     * @example
     * const tex = await loader.loadRemote<Texture2D>('https://x.png', { remote: { ext: '.png' } });
     */
    public loadRemote<T extends Asset>(url: string, opts: RemoteLoadOptions = {}): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            assetManager.loadRemote<T>(url, opts.remote ?? null, (err, asset) => {
                if (err) return reject(err);
                this._postProcess(asset, opts.keeper);
                resolve(asset);
            });
        });
    }

    /**
     * 私有：根据 opts.bundle 找到 / 加载目标 bundle，然后执行实际加载逻辑
     * 复用于 load / loadMany / loadDir
     */
    private _loadFromBundle<R>(opts: LoadOptions, doLoad: BundleLoader): Promise<R> {
        return new Promise<R>((resolve, reject) => {
            const onLoaded = (err: Error, res: any) => {
                if (err) return reject(err);
                this._postProcess(res, opts.keeper);
                resolve(res);
            };

            const bundleName = opts.bundle || DEFAULT_BUNDLE;
            const cached = assetManager.bundles.get(bundleName);
            if (cached) {
                doLoad(cached, onLoaded);
                return;
            }

            // resources 是内置 bundle，理论上一定存在；此分支主要服务自定义 bundle
            if (bundleName === DEFAULT_BUNDLE) {
                doLoad(resources, onLoaded);
                return;
            }

            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) return reject(err);
                doLoad(bundle, onLoaded);
            });
        });
    }

    /**
     * 私有：加载完成后的统一处理（泄漏跟踪 + keeper 缓存 / 防意外释放）
     * 单值 / 数组统一按数组遍历，避免重复分支
     */
    private _postProcess(res: Asset | Asset[], keeper?: ICCMResKeeper): void {
        if (!res) return;

        const list: Asset[] = Array.isArray(res) ? res : [res];

        if (this.resLeakChecker) {
            for (const asset of list) {
                this.resLeakChecker.traceAsset(asset);
            }
        }

        if (!keeper) return;

        const valid = isValid(keeper as any);
        for (const asset of list) {
            if (valid) {
                keeper.cacheAsset(asset);
            } else {
                // keeper 已失效：先加后减一次引用，防止意外释放外部模块的引用
                asset.addRef();
                asset.decRef();
            }
        }
    }
}
