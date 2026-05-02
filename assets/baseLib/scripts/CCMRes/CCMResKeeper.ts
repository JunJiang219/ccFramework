import { _decorator, Asset, CCInteger, Component } from "cc";
import { AssetType, CCMLoadResArgs, CompleteCallback, IRemoteOptions, ProgressCallback } from "./CCMResDefs";
import { CCMResArgsBuilder } from "./CCMResArgsBuilder";
import CCMResLoader from "./CCMResLoader";
import { CCMResManager } from "./CCMResManager";
import { CCMEventManager } from "../CCMEvent/CCMEventManager";

/**
 * 资源引用类
 * 1. 提供加载功能，并记录加载过的资源
 * 2. 在node释放时自动清理加载过的资源
 * 3. 无需手动添加记录
 * 
 * 2019-12-13 by 宝爷
 */
const { ccclass, property } = _decorator;

@ccclass
export class CCMResKeeper extends Component {

    @property(CCInteger)
    delayReleaseTime: number = 0;    // 延迟释放时间(单位：秒)

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
        if (!args) return;

        args.keeper = this;
        CCMResLoader.getInstance().load(args as any);
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
        if (!args) return;

        args.keeper = this;
        CCMResLoader.getInstance().loadDir(args as any);
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
        if (!args) return;

        args.keeper = this;
        CCMResLoader.getInstance().loadRemote(args as any);
    }

    /**
     * 缓存资源
     * @param asset 
     * @param args 
     */
    public cacheAsset(asset: Asset) {
        CCMResManager.getInstance().cacheAsset(this, asset);
    }

    protected onLoad(): void {
        this.registerGlobalEvents();
    }

    protected onEnable(): void {
        this.registerLocalEvents();
    }

    protected onDisable(): void {
        this.unRegisterLocalEvents();
    }

    /**
     * 组件销毁时自动释放所有keep的资源
     */
    protected onDestroy() {
        this.unRegisterGlobalEvents();
        CCMResManager.getInstance().invalidateKeeper(this);
        CCMResManager.getInstance().releaseKeeperAssets(this);
    }

    /**
     * 注册本地事件（节点事件）
     *
     */
    protected registerLocalEvents() {
        // override in subclass
    }

    /**
     * 注销本地事件
     */
    protected unRegisterLocalEvents() {
        // override in subclass
    }

    /**
     * 注册全局事件（eventBus管理事件）
     */
    protected registerGlobalEvents() {
        // override in subclass
    }

    /**
     * 注销全局事件
     */
    protected unRegisterGlobalEvents() {
        // override in subclass
        CCMEventManager.getInstance().removeByTarget(this);
    }
}