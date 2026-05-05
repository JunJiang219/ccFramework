import { Asset, Constructor } from "cc";

/**
 * 资源模块共享类型定义
 * 单独抽离以避免 CCMResUtils 与 CCMResKeeper 之间的循环引用
 */

/** 加载进度回调 */
export type ProgressCallback = (completedCount: number, totalCount: number, item: any) => void;

/** 远程加载可选参数（透传给 cc.assetManager.loadRemote） */
export type IRemoteOptions = Record<string, any>;

/**
 * 资源持有者接口（仅约定 cacheAsset 能力）
 * 由 CCMResKeeper 实现，用于 LoadOptions 等处的类型声明，避免直接引用 CCMResKeeper 类
 */
export interface ICCMResKeeper {
    cacheAsset(asset: Asset): void;
}

/**
 * 通用资源加载选项
 * 适用于 load / loadMany / loadDir
 */
export interface LoadOptions<T extends Asset = Asset> {
    /** bundle 名称，缺省为 'resources' */
    bundle?: string;
    /** 资源类型，可缺省由路径推导 */
    type?: Constructor<T>;
    /** 加载进度回调 */
    onProgress?: ProgressCallback;
    /** 资源持有者，加载完成后会自动 cacheAsset 以便随节点销毁释放 */
    keeper?: ICCMResKeeper;
}

/**
 * 远程资源加载选项
 */
export interface RemoteLoadOptions {
    /** 透传给 cc.assetManager.loadRemote 的原生参数（如 { ext: '.png' }） */
    remote?: IRemoteOptions;
    /** 资源持有者，加载完成后会自动 cacheAsset */
    keeper?: ICCMResKeeper;
}
