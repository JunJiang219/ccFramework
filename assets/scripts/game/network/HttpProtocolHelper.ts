/**
 * http协议辅助类
 */

import { CCMHttpMethod, httpReq } from "../../base/network/CCMHttpRequest";
import CCMCryptoUtil from "../../base/utils/CCMCryptoUtil";
import CCMUtil from "../../base/utils/CCMUtil";
import { GAME_CHANNEL_TYPE, GAME_DEMO_TYPE, GAME_LID_TYPE, GAME_SID_TYPE, Http_BaseLogin } from "../config/HttpDefine";
import { gameData, GameEnv } from "../data/GameData";
import { myUserData } from "../data/UserData";

const CONNECT_STR = "?formal_p=";

export default class HttpProtocolHelper {

    private static _instance: HttpProtocolHelper;
    private constructor() { }
    public static get inst(): HttpProtocolHelper {
        if (!HttpProtocolHelper._instance) {
            HttpProtocolHelper._instance = new HttpProtocolHelper();
        }
        return HttpProtocolHelper._instance;
    }

    private encodeMsgObj(msgObj: any) {
        let msgStep1 = JSON.stringify(msgObj);
        let msgStep2 = CCMCryptoUtil.encodeXXTEA(msgStep1, gameData.getXxteaKey());
        let msgStep3 = CCMCryptoUtil.encodeBase64(msgStep2);

        return msgStep3;
    }

    private decodeMsgStr(msgStr: string) {
        let msgStep1 = CCMCryptoUtil.decodeBase64(msgStr);
        let msgStep2 = CCMCryptoUtil.decodeXXTEA(msgStep1, gameData.getXxteaKey());
        let msgStep3 = JSON.parse(msgStep2);

        return msgStep3;
    }

    public async sendGuestLogin(): Promise<any> {
        let msgObj: Http_BaseLogin = { game_param: {} };
        msgObj.game_param.sig_sitemid = "";
        msgObj.game_param.name = myUserData.userName;
        msgObj.game_param.micon = "";
        msgObj.game_param.sesskey = "";
        msgObj.game_param.tmid = "";
        msgObj.game_param.imei = gameData.deviceId;
        msgObj.game_param.message = "";
        msgObj.game_param.google = "11";
        msgObj.sid = GAME_SID_TYPE.DEFAULT.toString();
        msgObj.lid = GAME_LID_TYPE.IMEI.toString();
        msgObj.channel = GAME_CHANNEL_TYPE.DEFAULT.toString();
        msgObj.demo = (gameData.gameEnv == GameEnv.DEV) ? GAME_DEMO_TYPE.TEST.toString() : GAME_DEMO_TYPE.FORMAL.toString();
        msgObj.version = gameData.version;

        let encodeMsg = this.encodeMsgObj(msgObj);
        let url = gameData.getBaseApiUrl() + gameData.subUrl_login + CONNECT_STR + encodeMsg;
        let reqInfo: CCMIHttpReqInfo = {
            method: CCMHttpMethod.GET,
            url: url,
            Headers: {
                "Content-Type": "application/json"
            }
        };

        return httpReq.send(reqInfo);
    }

}

export const httpHelper = HttpProtocolHelper.inst;