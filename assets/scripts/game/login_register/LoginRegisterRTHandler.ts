/**
 * 登录注册界面 富文本点击响应
 */

import { ccmLog } from "../../base/utils/CCMLog";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginRegisterRTHandler extends cc.Component {

    private openTermsOfService() {
        ccmLog.log("openTermsOfService");
        window.open("https://www.baidu.com");
    }
}
