import { Asset } from "cc";

/**
 * 资源模块共享类型定义
 * 单独抽离以避免 CCMResUtils 与 CCMResKeeper 之间的循环引用
 */

/** 加载进度回调 */
export type ProgressCallback = (completedCount: number, totalCount: number, item: any) => void;

/** 加载完成回调 */
export type CompleteCallback<T = any> = (error: Error, resource: any | any[], urls?: string[]) => void;

/** 远程加载可选参数 */
export type IRemoteOptions = Record<string, any> | null;

/** 资源类型（Asset 或其子类） */
export type AssetType<T = Asset> = typeof Asset;

/**
 * 资源持有者接口（仅约定 cacheAsset 能力）
 * 由 CCMResKeeper 实现，用于 CCMLoadResArgs 等处的类型声明，避免直接引用 CCMResKeeper 类
 */
export interface ICCMResKeeper {
    cacheAsset(asset: Asset): void;
}

/** 加载资源参数（单路径/多路径/目录） */
export interface CCMLoadResArgs<T extends Asset = Asset> {
    bundleName?: string;
    keeper?: ICCMResKeeper;
    path?: string;
    paths?: string[];
    dir?: string;
    url?: string;
    type?: AssetType<T> | null;
    options?: IRemoteOptions | null;
    onProgress?: ProgressCallback | null;
    onComplete?: CompleteCallback<T> | null;
}
