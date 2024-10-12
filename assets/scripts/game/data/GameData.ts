/**
 * 游戏全局数据
 */

// api地址
const BASE_API_URL_DEV = "http://api.twthgames.com/";
const BASE_API_URL_PRO = "http://api.xozyx.com/";

// xxtea加密key
const XXTEA_KEY = "BIGWIN@888!";

// 游戏环境
export const enum GameEnv {
    DEV = 0,
    PRO = 1,
}

export class GameData {

    private static _instance: GameData;
    private constructor() { }
    public static get inst(): GameData {
        if (!GameData._instance) {
            GameData._instance = new GameData();
        }
        return GameData._instance;
    }

    public gameEnv: GameEnv = GameEnv.DEV;  // 游戏环境
    public deviceId: string = "";           // 设备id
    public version: string = "1.0";         // 版本号

    // url域名后续地址
    public subUrl_login: string = "script/"

    public init() {
        // 初始化数据
    }

    public clear() {
        // 清除数据
    }

    public getBaseApiUrl(env?: GameEnv): string {
        if (undefined === env) env = this.gameEnv;
        return env === GameEnv.DEV ? BASE_API_URL_DEV : BASE_API_URL_PRO;
    }

    public getXxteaKey(env?: GameEnv): string {
        return XXTEA_KEY;
    }
}

export const gameData = GameData.inst;