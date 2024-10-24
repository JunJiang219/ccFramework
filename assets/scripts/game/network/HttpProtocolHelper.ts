/**
 * http协议辅助类
 */

import { CCMHttpMethod, CCMIHttpReqInfo, httpReq } from "../../base/network/CCMHttpRequest";
import CCMCryptoUtil from "../../base/utils/CCMCryptoUtil";
import { ccmLog } from "../../base/utils/CCMLog";
import { GAME_CHANNEL_TYPE, GAME_DEMO_TYPE, GAME_LID_TYPE, GAME_SID_TYPE, Http_BaseLogin, HTTP_SUB_URL } from "../config/HttpDefine";
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
        let msgStep2 = CCMCryptoUtil.xxtea_encryptToBase64(msgStep1, gameData.getXxteaKey());

        return msgStep2;
    }

    public decodeMsgStr(msgStr: string) {
        let msgStep1 = CCMCryptoUtil.xxtea_decryptFromBase64(msgStr, gameData.getXxteaKey());
        ccmLog.log("decodeMsgStr msgStep1:", msgStep1);
        let msgStep2 = JSON.parse(msgStep1);
        ccmLog.log("decodeMsgStr msgStep2:", msgStep2);

        return msgStep2;
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
        ccmLog.log("sendGuestLogin encodeMsg:", encodeMsg);
        let url = gameData.getBaseApiUrl() + HTTP_SUB_URL.LOGIN;
        let formData = new FormData();
        formData.append("formal_p", encodeMsg);

        let reqInfo: CCMIHttpReqInfo = {
            method: CCMHttpMethod.POST,
            url: url,
            data: formData
        };

        return httpReq.send(reqInfo);
    }

}

export const httpHelper = HttpProtocolHelper.inst;