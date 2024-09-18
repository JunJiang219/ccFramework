/**
 * 提示管理器
 */

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
