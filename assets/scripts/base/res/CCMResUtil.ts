/**
 * 资源使用相关工具类
 * 2020-1-18 by 宝爷
 */

import { CCMResKeeper } from "./CCMResKeeper";

import Asset = cc.Asset;
import Node = cc.Node;
import Prefab = cc.Prefab;
import js = cc.js;
import instantiate = cc.instantiate;
import { CCMResCacheArgs } from "./CCMResManager";
import { ccmLog } from "../utils/CCMLog";

export type ProgressCallback = (finish: number, total: number, item: any) => void;
export type CompleteCallback<T = any> = (error: Error, assets: any | any[]) => void;
export type IRemoteOptions = Record<string, any> | null;
export type AssetType<T = Asset> = typeof Asset;

export interface CCMILoadResArgs<T extends Asset> {
    paths?: string | string[];                                          // 资源路径
    dir?: string;                                                       // 资源目录   
    type?: AssetType<T> | null;                                         // 资源类型
    options?: IRemoteOptions | null;                                    // 远程资源可选参数
    onProgress?: ProgressCallback | null;                               // 加载进度回调
    onComplete?: CompleteCallback<T> | null;                            // 加载完成回调
    bundleName?: string;                                                // 资源所属bundle名称
    keeper?: CCMResKeeper;                                              // 资源管理器，用于资源的缓存和释放
}

export class CCMResUtil {

    /**
     * 构建bundle内资源加载参数结构体
     */
    public static makeLoadResArgs<T extends Asset>(): CCMILoadResArgs<T> | null {
        if (arguments.length < 1) {
            ccmLog.error(`makeLoadResArgs error ${arguments}`);
            return null;
        }

        let resArgs: CCMILoadResArgs<T> = { bundleName: "resources" };
        if (typeof arguments[0] == "string") {
            resArgs.paths = arguments[0];
        } else if (arguments[0] instanceof Array) {
            resArgs.paths = arguments[0];
        } else if (arguments[0] instanceof Object) {
            return arguments[0];    // 已经是 CCMILoadResArgs
        } else {
            ccmLog.error(`makeLoadResArgs error ${arguments}`);
            return null;
        }

        for (let i = 1; i < arguments.length; ++i) {
            if (i == 1 && js.isChildClassOf(arguments[i], Asset)) {
                // 判断是不是第一个参数type
                resArgs.type = arguments[i];
            } else if (typeof arguments[i] == "string") {
                resArgs.bundleName = arguments[i];
            } else if (typeof arguments[i] == "function") {
                // 其他情况为函数
                if (arguments.length > i + 1 && typeof arguments[i + 1] == "function") {
                    resArgs.onProgress = arguments[i];
                } else {
                    resArgs.onComplete = arguments[i];
                }
            }
        }

        return resArgs;
    }

    /**
     * 构建远程资源加载参数结构体
     */
    public static makeLoadRemoteArgs<T extends Asset>(): CCMILoadResArgs<T> | null {
        if (arguments.length < 1) {
            ccmLog.error(`makeLoadRemoteArgs error ${arguments}`);
            return null;
        }

        let resArgs: CCMILoadResArgs<T> = {};
        if (typeof arguments[0] == "string") {
            resArgs.paths = arguments[0];
        } else if (arguments[0] instanceof Object) {
            return arguments[0];    // 已经是 CCMILoadResArgs
        } else {
            ccmLog.error(`makeLoadRemoteArgs error ${arguments}`);
            return null;
        }

        for (let i = 1; i < arguments.length; ++i) {
            if (typeof arguments[i] == "function") {
                resArgs.onComplete = arguments[i];
            } else if (arguments[i] instanceof Object) {
                resArgs.options = arguments[i];
            }
        }

        return resArgs;
    }

    /**
     * 从目标节点或其父节点递归查找一个资源挂载组件
     * @param attachNode 目标节点
     * @param autoCreate 当目标节点找不到ResKeeper时是否自动创建一个
     */
    public static getResKeeper(attachNode: Node, autoCreate?: boolean): CCMResKeeper | null {
        if (attachNode) {
            let ret = attachNode.getComponent(CCMResKeeper);
            if (!ret) {
                if (autoCreate) {
                    return attachNode.addComponent(CCMResKeeper);
                } else {
                    return CCMResUtil.getResKeeper(attachNode.parent!, autoCreate);
                }
            }
            return ret;
        }
        // 返回一个默认的ResKeeper
        return null;
    }

    /**
    * 赋值srcAsset，并使其跟随targetNode自动释放，用法如下
    * mySprite.spriteFrame = AssignWith(otherSpriteFrame, mySpriteNode);
    * @param srcAsset 用于赋值的资源，如cc.SpriteFrame、cc.Texture等等
    * @param targetNode 
    * @param args 缓存参数
    * @param autoCreate 
    */
    public static assignWith(srcAsset: Asset, targetNode: Node, args?: CCMResCacheArgs, autoCreate?: boolean): any {
        let keeper = CCMResUtil.getResKeeper(targetNode, autoCreate);
        if (keeper && srcAsset instanceof Asset) {
            keeper.cacheAsset(srcAsset, args);
            return srcAsset;
        } else {
            console.error(`assignWith ${srcAsset} to ${targetNode} faile`);
            return null;
        }
    }

    /**
     * 实例化一个prefab，并带自动释放功能
     * @param prefab 要实例化的预制
     * @param args 缓存参数
     */
    public static instantiate(prefab: Prefab, args?: CCMResCacheArgs): Node {
        let node = instantiate(prefab);
        let keeper = CCMResUtil.getResKeeper(node, true);
        if (keeper) {
            keeper.cacheAsset(prefab, args);
        }
        return node;
    }

    /**
     * 从字符串中查找第N个字符
     * @param str 目标字符串
     * @param cha 要查找的字符
     * @param num 第N个
     */
    static findCharPos(str: string, cha: string, num: number): number {
        let x = str.indexOf(cha);
        let ret = x;
        for (var i = 0; i < num; i++) {
            x = str.indexOf(cha, x + 1);
            if (x != -1) {
                ret = x;
            } else {
                return ret;
            }
        }
        return ret;
    }

    /**
     * 获取当前调用堆栈
     * @param popCount 要弹出的堆栈数量
     */
    static getCallStack(popCount: number): string {
        // 严格模式无法访问 arguments.callee.caller 获取堆栈，只能先用Error的stack
        let ret = (new Error()).stack;
        let pos = CCMResUtil.findCharPos(ret!, '\n', popCount);
        if (pos > 0) {
            ret = ret!.slice(pos);
        }
        return ret!;
    }
}
