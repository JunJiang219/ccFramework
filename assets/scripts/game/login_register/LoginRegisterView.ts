/**
 * 登录注册界面
 */

import { evtMgr } from "../../base/common/CCMEventManager";
import { CCMEvent } from "../../base/config/CCMEvent";
import { i18nMgr } from "../../base/i18n/CCMI18nManager";
import { CCMIUIArgs, uiMgr } from "../../base/ui/CCMUIManager";
import CCMUIView from "../../base/ui/CCMUIView";
import CCMCryptoUtil from "../../base/utils/CCMCryptoUtil";
import { ccmLog } from "../../base/utils/CCMLog";
import { httpHelper } from "../network/HttpProtocolHelper";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginRegisterView extends CCMUIView {

    @property(cc.Node)
    loginLayer: cc.Node = null;

    @property(cc.Toggle)
    rememberMeToggle: cc.Toggle = null;

    @property(cc.EditBox)
    phoneNumEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    passwordEditBox: cc.EditBox = null;

    private regEvent() {
        evtMgr.addEventListener(CCMEvent.OPERATE_SET_LANGUAGE, this.onSetLanguage, this);
    }

    private unRegEvent() {
        evtMgr.removeEventListener(CCMEvent.OPERATE_SET_LANGUAGE, this.onSetLanguage, this);
    }

    protected start(): void {
        this.regEvent();
        this.updateLanguage();
    }

    protected onDestroy(): void {
        this.unRegEvent();
        super.onDestroy();
    }

    public onOpen(fromUIID: number, uiArgs?: CCMIUIArgs): void {

    }

    private onSetLanguage(eventName: string, eventData: any) {
        this.updateLanguage();
    }

    // 更新余下多语言
    private updateLanguage() {
        this.phoneNumEditBox.placeholder = i18nMgr.getTextValue("lr_phoneNum");
        this.passwordEditBox.placeholder = i18nMgr.getTextValue("lr_pwd");
    }

    private clearPhoneNum() {
        this.phoneNumEditBox.string = "";
    }

    private onClearPhoneNumBtnClick(event: cc.Event.EventTouch, customData: string) {
        this.clearPhoneNum();
    }

    private onGuestBtnClick(event: cc.Event.EventTouch, customData: string) {
        // TODO: 实现游客登录逻辑
        ccmLog.log("onGuestBtnClick");
        httpHelper.sendGuestLogin()
            .then((res) => {
                ccmLog.log("onGuestBtnClick res", res);
            })
            .catch((err) => {
                ccmLog.error("onGuestBtnClick err", err);
            });
    }

    private onCloseBtnClick(event: cc.Event.EventTouch, customData: string) {
        uiMgr.close(this);
    }
}
