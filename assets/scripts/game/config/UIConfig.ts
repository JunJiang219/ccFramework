import { CCMIDialogConf, CCMIToastConf } from "../../base/ui/CCMTipsManager";
import { CCMIUIConf } from "../../base/ui/CCMUIManager";
import { CCMUILayerID } from "../../base/ui/CCMUIView";

/** ------------------------------ Dialog Config ----------------------------- */
export enum DIALOGID {
    DEFAULT,    // 默认的对话框
}

export const DialogConfig: { [dialogId: number]: CCMIDialogConf } = {
    [DIALOGID.DEFAULT]: { prefabPath: "prefabs/common/dialog", preventTouch: true }
}
/** ------------------------------ Dialog Config ----------------------------- */

/** ------------------------------ Toast Config ----------------------------- */
export enum TOASTID {
    DEFAULT,    // 默认的对话框
}

export const ToastConfig: { [toastId: number]: CCMIToastConf } = {
    [TOASTID.DEFAULT]: { prefabPath: "prefabs/common/toast" }
}
/** ------------------------------ Toast Config ----------------------------- */


/** ------------------------------ UI Config --------------------------------- */
export enum UIID {
    TEST,
    ROOT1,
    ROOT2,
}

let baseZOrder_Game = 0;
export const UIConfig: { [uiId: number]: CCMIUIConf } = {
    [UIID.TEST]: { prefabPath: "prefabs/test/test", layerId: CCMUILayerID.Game, zOrder: ++baseZOrder_Game, preventTouch: false },
    [UIID.ROOT1]: { prefabPath: "prefabs/test/root1", layerId: CCMUILayerID.Game, zOrder: ++baseZOrder_Game, preventTouch: false },
    [UIID.ROOT2]: { prefabPath: "prefabs/test/root2", layerId: CCMUILayerID.Game, zOrder: ++baseZOrder_Game, preventTouch: false },
};
/** ------------------------------ UI Config --------------------------------- */