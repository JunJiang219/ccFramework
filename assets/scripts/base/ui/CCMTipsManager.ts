/**
 * 提示管理器
 */

import { CCMUILayerID } from "./CCMUIView";

// toast参数
export interface CCMIToastOptions {
    text: string;
    duration?: number;
}

// 模态提示框回调
export type CCMDialogCallback = { callback: Function, target?: any };

// dialog参数
export interface CCMIDialogOptions {
    text: string;
    okText?: string;                            // 确定按钮文字
    cancelText?: string;                        // 取消按钮文字
    okCallback?: CCMDialogCallback;             // 点击确定按钮回调
    cancelCallback?: CCMDialogCallback;         // 点击取消按钮回调
}

// dialog配置
export interface CCMIDialogConf {
    bundleName?: string;          // bundle名，不配则取默认值 'resources'
    prefabPath: string;           // UI预制体路径
    preventTouch?: boolean;       // 是否添加防触摸穿透节点
    preventColor?: cc.Color;      // 防触摸节点颜色
}

// toast配置
export interface CCMIToastConf {
    bundleName?: string;          // bundle名，不配则取默认值'resources'
    prefabPath: string;           // UI预制体路径
}

export default class CCMTipsManager {

    private static _instance: CCMTipsManager;
    private constructor() { }
    public static get inst(): CCMTipsManager {
        if (!CCMTipsManager._instance) {
            CCMTipsManager._instance = new CCMTipsManager();
        }
        return CCMTipsManager._instance;
    }
}

export const tipsMgr = CCMTipsManager.inst;