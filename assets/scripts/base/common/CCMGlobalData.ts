/**
 * 全局数据
 */

export class CCMGlobalData {

    private static _instance: CCMGlobalData;
    private constructor() { }
    public static get inst(): CCMGlobalData {
        if (!CCMGlobalData._instance) {
            CCMGlobalData._instance = new CCMGlobalData();
        }
        return CCMGlobalData._instance;
    }

    public isLandscape: boolean = false;    // 是否横屏
}

export const ccmGData = CCMGlobalData.inst;