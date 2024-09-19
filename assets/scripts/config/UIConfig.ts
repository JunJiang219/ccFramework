import { CCMIUIConf } from "../base/ui/CCMUIManager";
import { CCMUILayerID } from "../base/ui/CCMUIView";

export enum UIID {
    ROOT1,
    ROOT2,
}

let baseZOrder_Game = -1;
export const UIConfig: { [uiId: number]: CCMIUIConf } = {
    [UIID.ROOT1]: { prefabPath: "prefabs/root1", layerId: CCMUILayerID.Game, zOrder: ++baseZOrder_Game, preventTouch: true },
    [UIID.ROOT2]: { prefabPath: "prefabs/root2", layerId: CCMUILayerID.Game, zOrder: ++baseZOrder_Game, preventTouch: false },
};