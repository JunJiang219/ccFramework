import { CCMLayerID } from "../../base/ui/CCMLayerManager";
import { CCMIUIConf } from "../../base/ui/CCMUIManager";
import { CCMUIShowType } from "../../base/ui/CCMUIView";
/** ------------------------------ UI Config --------------------------------- */
export enum UIID {
    LOGIN_REGISTER,

    // 以下为测试用UI
    TEST,
    ROOT1,
    ROOT2,

    DIALOG,
    TOAST,
}

export const UIConfig: { [uiId: number]: CCMIUIConf } = {
    [UIID.LOGIN_REGISTER]: { prefabPath: "prefabs/login_register/login_register", showType: CCMUIShowType.UISingle, layerId: CCMLayerID.UI, preventTouch: true },

    [UIID.TEST]: { prefabPath: "prefabs/test/test", showType: CCMUIShowType.UIIndependent, layerId: CCMLayerID.UI, preventTouch: false },
    [UIID.ROOT1]: { prefabPath: "prefabs/test/root1", showType: CCMUIShowType.UIAddition, layerId: CCMLayerID.UI, preventTouch: false },
    [UIID.ROOT2]: { prefabPath: "prefabs/test/root2", showType: CCMUIShowType.UIAddition, layerId: CCMLayerID.UI, preventTouch: false },

    [UIID.DIALOG]: { prefabPath: "prefabs/common/dialog", showType: CCMUIShowType.UIAddition, layerId: CCMLayerID.Dialog, preventTouch: true, multiInstance: true },
    [UIID.TOAST]: { prefabPath: "prefabs/common/toast", showType: CCMUIShowType.UIAddition, layerId: CCMLayerID.Toast, preventTouch: false, multiInstance: true },
};
/** ------------------------------ UI Config --------------------------------- */