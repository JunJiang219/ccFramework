import { CCMLayerID } from "db://assets/baseLib/scripts/CCMLayer/CCMLayerManager";

export const GAME_BUNDLE_NAME = "game";

export enum UIID {
    TestUI = 1,
}

export const UIConfig = {
    [UIID.TestUI]: { prefabPath: "prefabs/test/TestUI", layerId: CCMLayerID.GAME, preventTouch: true, bundleName: GAME_BUNDLE_NAME },
};
