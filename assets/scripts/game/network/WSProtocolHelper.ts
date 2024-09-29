/**
 * websocket协议辅助类
 */

import { CCMIProtocolHelper, CCMNetData } from "../../base/network/CCMNetInterface";

export default class WSProtocolHelper implements CCMIProtocolHelper {

    getHeadLen(): number {
        return 0;
    }
    getHeartbeat(): CCMNetData {
        return "";
    }
    getPackageLen(msg: CCMNetData): number {
        return msg.toString().length;
    }
    checkPackage(msg: CCMNetData): boolean {
        return true;
    }
    getPackageId(msg: CCMNetData): number {
        return 0;
    }
}
