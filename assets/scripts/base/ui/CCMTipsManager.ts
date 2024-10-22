/**
 * 提示管理器
 */

import { ccmLog } from "../utils/CCMLog";
import CCMDialogView, { CCMIDialogOptions } from "./CCMDialogView";
import CCMToastView, { CCMIToastOptions } from "./CCMToastView";
import { uiMgr } from "./CCMUIManager";
import CCMUIView from "./CCMUIView";

export default class CCMTipsManager {

    private static _instance: CCMTipsManager;
    private constructor() { }
    public static get inst(): CCMTipsManager {
        if (!CCMTipsManager._instance) {
            CCMTipsManager._instance = new CCMTipsManager();
        }
        return CCMTipsManager._instance;
    }

    public showDialog(options: CCMIDialogOptions, closeOther: boolean = false, dialogId?: number) {
        if (closeOther) this.closeAllDialogs();

        let dialogIdArr = uiMgr.dialogIds;
        if (undefined === dialogId) dialogId = dialogIdArr[0];
        if (!dialogIdArr.includes(dialogId)) {
            // 防止操作 dialog 以外 ui
            ccmLog.error(`showDialog ${dialogId} abandon! not dialog`);
            return;
        }
        uiMgr.open(dialogId, options);
    }

    // 关闭指定dialog
    public closeDialog(uiOrId: CCMDialogView | number, options: CCMIDialogOptions = null, noCache: boolean = false) {
        let dialogIdArr = uiMgr.dialogIds;
        let dialogId: number = 0;
        if ('number' == typeof uiOrId) {
            dialogId = uiOrId;
        } else {
            dialogId = uiOrId.uiId;
        }
        if (!dialogIdArr.includes(dialogId)) {
            // 防止操作 dialog 以外 ui
            ccmLog.error(`closeDialog ${dialogId} abandon! not dialog`);
            return;
        }

        uiMgr.close(uiOrId as CCMUIView | number, options, noCache);
    }

    // 关闭所有dialog
    public closeAllDialogs(noCache: boolean = false) {
        uiMgr.dialogIds.forEach(dialogId => {
            this.closeDialog(dialogId, null, noCache);
        });
    }

    // 展示toast
    public showToast(options: CCMIToastOptions, closeOther: boolean = false, toastId?: number) {
        if (closeOther) this.closeAllToasts();

        let toastIdArr = uiMgr.toastIds;
        if (undefined === toastId) toastId = toastIdArr[0];
        if (!toastIdArr.includes(toastId)) {
            // 防止操作 toast 以外 ui
            ccmLog.error(`showToast ${toastId} abandon! not toast`);
            return;
        }
        uiMgr.open(toastId, options);
    }

    // 关闭指定toast
    public closeToast(uiOrId: CCMToastView | number, options: CCMIToastOptions = null, noCache: boolean = false) {
        let toastIdArr = uiMgr.toastIds;
        let toastId: number = 0;
        if ('number' == typeof uiOrId) {
            toastId = uiOrId;
        } else {
            toastId = uiOrId.uiId;
        }
        if (!toastIdArr.includes(toastId)) {
            // 防止操作 toast 以外 ui
            ccmLog.error(`closeToast ${toastId} abandon! not toast`);
            return;
        }

        uiMgr.close(uiOrId as CCMUIView | number, options, noCache);
    }

    // 关闭所有toast
    public closeAllToasts(noCache: boolean = false) {
        uiMgr.toastIds.forEach(toastId => {
            this.closeToast(toastId, null, noCache);
        });
    }
}

export const tipsMgr = CCMTipsManager.inst;