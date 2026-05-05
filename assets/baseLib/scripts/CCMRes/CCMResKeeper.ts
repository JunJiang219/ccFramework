import { _decorator, Asset, CCInteger, Component } from "cc";
import { LoadOptions, RemoteLoadOptions } from "./CCMResDefs";
import CCMResLoader from "./CCMResLoader";
import { CCMResManager } from "./CCMResManager";
import { CCMEventManager } from "../CCMEvent/CCMEventManager";

/**
 * 资源引用类
 * 1. 提供加载功能，并记录加载过的资源
 * 2. 在 node 释放时自动清理加载过的资源
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
     * 加载单个资源（自动以本组件为 keeper，节点销毁时自动释放）
     */
    public load<T extends Asset>(path: string, opts: LoadOptions<T> = {}): Promise<T> {
        return CCMResLoader.getInstance().load<T>(path, { ...opts, keeper: this });
    }

    /**
     * 加载多个资源
     */
    public loadMany<T extends Asset>(paths: string[], opts: LoadOptions<T> = {}): Promise<T[]> {
        return CCMResLoader.getInstance().loadMany<T>(paths, { ...opts, keeper: this });
    }

    /**
     * 加载整个目录
     */
    public loadDir<T extends Asset>(dir: string, opts: LoadOptions<T> = {}): Promise<T[]> {
        return CCMResLoader.getInstance().loadDir<T>(dir, { ...opts, keeper: this });
    }

    /**
     * 加载远程资源
     */
    public loadRemote<T extends Asset>(url: string, opts: RemoteLoadOptions = {}): Promise<T> {
        return CCMResLoader.getInstance().loadRemote<T>(url, { ...opts, keeper: this });
    }

    /**
     * 缓存资源（手动追加托管）
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
     * 组件销毁时自动释放所有 keep 的资源
     */
    protected onDestroy() {
        this.unRegisterGlobalEvents();
        CCMResManager.getInstance().invalidateKeeper(this);
        CCMResManager.getInstance().releaseKeeperAssets(this);
    }

    /**
     * 注册本地事件（节点事件）
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
     * 注册全局事件（eventBus 管理事件）
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
