/**
 * ResLoader2，封装资源的加载和卸载接口，隐藏新老资源底层差异
 * 1. 加载资源接口
 * 2. 卸载资源接口
 * 
 * 2021-1-24 by 宝爷
 */

/*import { Asset, js, error, Constructor, resources, __private, assetManager, AssetManager } from "cc";
export type ProgressCallback = __private.cocos_core_asset_manager_shared_ProgressCallback;
export type CompleteCallback<T = any> = __private.cocos_core_asset_manager_shared_CompleteCallbackWithData;
export type IRemoteOptions = __private.cocos_core_asset_manager_shared_IRemoteOptions;
export type AssetType<T = Asset> = Constructor<T>;*/

import { CCMResLeakChecker } from "./CCMResLeakChecker";

import Asset = cc.Asset;
import js = cc.js;
import error = cc.error;
import resources = cc.resources;
import assetManager = cc.assetManager;
import AssetManager = cc.AssetManager;
import isValid = cc.isValid;
import { AssetType, CCMILoadResArgs, CCMResUtil, CompleteCallback, IRemoteOptions, ProgressCallback } from "./CCMResUtil";

export default class CCMResLoader {

    public resLeakChecker: CCMResLeakChecker = null;
    private static _instance: CCMResLoader = null;
    private constructor() { }
    public static get inst(): CCMResLoader {
        if (!CCMResLoader._instance) {
            CCMResLoader._instance = new CCMResLoader();
        }
        return CCMResLoader._instance;
    }

    private _loadByBundleAndArgs<T extends Asset>(bundle: AssetManager.Bundle, args: CCMILoadResArgs<T>): void {
        let finishCb: CompleteCallback<T> | CompleteCallback<T[]> | null = (err, assets) => {
            if (!err) {
                if (assets instanceof Array) {
                    // 加载一组资源
                    if (this.resLeakChecker) {
                        for (let i = 0, len = assets.length; i < len; ++i) {
                            this.resLeakChecker.traceAsset(assets[i]);
                        }
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
                    // 加载单个资源
                    if (this.resLeakChecker) this.resLeakChecker.traceAsset(assets);

                    if (args.keeper) {
                        if (isValid(args.keeper)) {
                            args.keeper.cacheAsset(assets);
                        } else {
                            assets.addRef();
                            assets.decRef();     // 这里引用需要先加后减，防止意外释放外部模块的引用
                        }
                    }
                }
            }
            if (args.onComplete) args.onComplete(err, assets);
        }

        if (args.dir) {
            bundle.loadDir(args.dir, args.type!, args.onProgress!, finishCb);
        } else {
            if (typeof args.paths == 'string') {
                bundle.load(args.paths, args.type!, args.onProgress!, finishCb);
            } else {
                bundle.load(args.paths as string[], args.type!, args.onProgress!, finishCb);
            }
        }
    }

    private _loadByArgs<T extends Asset>(args: CCMILoadResArgs<T>) {
        if (args.bundleName) {
            let bundle = assetManager.bundles.get(args.bundleName);
            if (bundle) {
                this._loadByBundleAndArgs(bundle!, args);
            } else {
                // 自动加载bundle
                assetManager.loadBundle(args.bundleName, (err, bundle) => {
                    if (!err) {
                        this._loadByBundleAndArgs(bundle, args);
                    }
                })
            }
        } else {
            this._loadByBundleAndArgs(resources, args);
        }
    }

    /**
     * 加载单个或一组资源
     * @param paths 资源路径
     * @param type 资源类型
     * @param onProgress 加载进度回调
     * @param onComplete 加载完成回调
     * @param bundleName bundle名
     */
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(): void {
        let args = CCMResUtil.makeLoadResArgs.apply(this, arguments as any);
        if (args) this._loadByArgs(args);
    }

    /**
     * 加载指定目录资源
     * @param dir 目录
     * @param type 资源类型
     * @param onProgress 加载进度回调
     * @param onComplete 加载完成回调
     * @param bundleName bundle名
     */
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(): void {
        let args = CCMResUtil.makeLoadResArgs.apply(this, arguments as any);
        if (args) {
            args.dir = args.paths as string;
            this._loadByArgs(args);
        }
    }

    /**
     * 加载远程资源
     * @param url 远程地址
     * @param options 可选参数
     * @param onComplete 加载完成回调
     */
    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(): void {
        let args = CCMResUtil.makeLoadRemoteArgs.apply(this, arguments as any);
        if (args) {
            let finishCb: CompleteCallback<T> | CompleteCallback<T[]> | null = (err, assets) => {
                if (!err) {
                    if (this.resLeakChecker) this.resLeakChecker.traceAsset(assets);
                    isValid(args!.keeper) && args!.keeper!.cacheAsset(assets);
                }
                if (args!.onComplete) args!.onComplete(err, assets);
            }
            assetManager.loadRemote(args.paths as string, args.options!, finishCb);
        }
    }
}

export const resLoader = CCMResLoader.inst;