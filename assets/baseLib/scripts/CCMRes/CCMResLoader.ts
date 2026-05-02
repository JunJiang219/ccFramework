/**
 * ResLoader2，封装资源的加载和卸载接口，隐藏新老资源底层差异
 * 1. 加载资源接口
 * 2. 卸载资源接口
 */

/*import { Asset, js, error, Constructor, resources, __private, assetManager, AssetManager } from "cc";
export type ProgressCallback = __private.cocos_core_asset_manager_shared_ProgressCallback;
export type CompleteCallback<T = any> = __private.cocos_core_asset_manager_shared_CompleteCallbackWithData;
export type IRemoteOptions = __private.cocos_core_asset_manager_shared_IRemoteOptions;
export type AssetType<T = Asset> = Constructor<T>;*/

import { Asset, assetManager, AssetManager, isValid, JsonAsset, resources } from "cc";
import { CCMResLeakChecker } from "./CCMResLeakChecker";
import { AssetType, CCMLoadResArgs, CompleteCallback, IRemoteOptions, ProgressCallback } from "./CCMResDefs";
import { CCMResArgsBuilder } from "./CCMResArgsBuilder";
import CCMLogger from "../CCMLog/CCMLogger";

export default class CCMResLoader {

    public resLeakChecker: CCMResLeakChecker = null;
    private static _instance: CCMResLoader = null;
    private constructor() { }
    public static getInstance(): CCMResLoader {
        if (!CCMResLoader._instance) {
            CCMResLoader._instance = new CCMResLoader();
        }
        return CCMResLoader._instance;
    }

    private loadByBundleAndArgs<T extends Asset>(bundle: AssetManager.Bundle, args: CCMLoadResArgs<T>): void {
        // 完成回调重组
        let onCompleteOut = args.onComplete;
        let finalComplete = (error: Error, assets: any | any[], urls?: string[]) => {
            if (!error) {
                if (assets instanceof Array) {
                    if (this.resLeakChecker) {
                        assets.forEach(element => {
                            this.resLeakChecker.traceAsset(element);
                        });
                    }
    
                    if (args.keeper) {
                        // 通过 keeper 对象接口加载
                        if (isValid(args.keeper)) {
                            // keeper 对象有效
                            for (let i = 0, len = assets.length; i < len; ++i) {
                                args.keeper.cacheAsset(assets[i]);
                            }
                        } else {
                            // keeper 对象失效
                            for (let i = 0, len = assets.length; i < len; ++i) {
                                assets[i].addRef();
                                assets[i].decRef();     // 这里引用需要先加后减，防止意外释放外部模块的引用
                            }
                        }
                    }
                } else {
                    if (this.resLeakChecker) {
                        this.resLeakChecker.traceAsset(assets);
                    }
    
                    if (args.keeper) {
                        if (isValid(args.keeper)) {
                            args.keeper.cacheAsset(assets);
                        } else {
                            assets.addRef();
                            assets.decRef();
                        }
                    }
                }
            }

            if (onCompleteOut) {
                onCompleteOut(error, assets, urls);
            }
        }
        args.onComplete = finalComplete;

        if (args.path) {
            bundle.load(args.path, args.type, args.onProgress, args.onComplete);
        } else if (args.paths) {
            bundle.load(args.path, args.type, args.onProgress, args.onComplete);
        } else if (args.dir) {
            bundle.loadDir(args.dir, args.type, args.onProgress, args.onComplete);
        } else if (args.url) {
            assetManager.loadRemote(args.url, args.options, args.onComplete);
        } else {
            CCMLogger.getInstance().error("call loadByBundleAndArgs() by wrong arguments: ", args);
        }
    }

    private loadByArgs<T extends Asset>(args: CCMLoadResArgs<T>) {
        if (args.bundleName) {
            if (assetManager.bundles.has(args.bundleName)) {
                let bundle = assetManager.bundles.get(args.bundleName);
                this.loadByBundleAndArgs(bundle!, args);
            } else {
                // 自动加载bundle
                assetManager.loadBundle(args.bundleName, (err, bundle) => {
                    if (!err) {
                        this.loadByBundleAndArgs(bundle, args);
                    }
                })
            }
        } else {
            this.loadByBundleAndArgs(resources, args);
        }
    }

    /**
     * 加载指定资源
     * @param bundleName    bundle的名字
     * @param paths         单个资源路径 | 一组资源路径
     * @param type          资源类型，默认为null
     * @param onProgress    加载进度回调
     * @param onComplete    加载完成回调
     */
    public load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>() {
        let args: CCMLoadResArgs<T> | null = CCMResArgsBuilder.makeLoadResArgs.apply(this, arguments);
        this.loadByArgs(args);
    }

    /**
     * 加载目录资源
     * @param bundleName    bundle的名字
     * @param dir           资源目录
     * @param type          资源类型，默认为null
     * @param onProgress    加载进度回调
     * @param onComplete    加载完成回调
     */
    public loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(bundleName: string, dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(bundleName: string, dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>() {
        let args: CCMLoadResArgs<T> | null = CCMResArgsBuilder.makeLoadDirArgs.apply(this, arguments);
        this.loadByArgs(args);
    }

    /**
     * 加载远程资源
     * @param url           远程资源url
     * @param options       加载可选参数
     * @param onComplete    加载完成回调
     */
    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | CompleteCallback<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>() {
        let args: CCMLoadResArgs<T> | null = CCMResArgsBuilder.makeLoadRemoteArgs.apply(this, arguments);
        this.loadByArgs(args);
    }

    /**
     * Promise 形式加载目录内的 JSON 资源，返回以文件名为键的 JSON 对象字典
     * @param bundleName  bundle 名称
     * @param dir         目录路径（如 'config'）
     * @returns           { [name: string]: any } 字典，失败时返回 null
     */
    public loadDirJsonAsync(bundleName: string, dir: string): Promise<Record<string, any> | null> {
        return new Promise<Record<string, any> | null>(resolve => {
            this.loadDir<JsonAsset>(bundleName, dir, JsonAsset, (err: Error, assets: JsonAsset[]) => {
                if (err) {
                    CCMLogger.getInstance().error(`CCMResLoader.loadDirJsonAsync: bundle=${bundleName} dir=${dir}`, err);
                    resolve(null);
                    return;
                }
                const result: Record<string, any> = {};
                for (const asset of assets) {
                    result[asset.name] = asset.json;
                }
                resolve(result);
            });
        });
    }
}