import { CCMIDialogConf } from "../base/ui/CCMTipsManager";
import { CCMIUIConf } from "../base/ui/CCMUIManager";
import { CCMUILayerID } from "../base/ui/CCMUIView";

/** ------------------------------ Dialog Config ----------------------------- */
export enum DIALOGID {
    DEFAULT,    // 默认的对话框
}

export const DialogConfig: { [dialogId: number]: CCMIDialogConf } = {
    [DIALOGID.DEFAULT]: { prefabPath: "prefabs/common/@dialog", preventTouch: false }
}
/** ------------------------------ Dialog Config ----------------------------- */


/** ------------------------------ UI Config --------------------------------- */
export enum UIID {
    ROOT1,
    ROOT2,
}

let baseZOrder_Game = 0;
export const UIConfig: { [uiId: number]: CCMIUIConf } = {
    [UIID.ROOT1]: { prefabPath: "prefabs/root1", layerId: CCMUILayerID.Game, zOrder: ++baseZOrder_Game, preventTouch: false },
    [UIID.ROOT2]: { prefabPath: "prefabs/root2", layerId: CCMUILayerID.Game, zOrder: ++baseZOrder_Game, preventTouch: false },
};
/** ------------------------------ UI Config --------------------------------- */