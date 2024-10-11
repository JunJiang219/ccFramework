/**
 * 登录注册界面
 */

import { CCMIUIArgs, uiMgr } from "../../base/ui/CCMUIManager";
import CCMUIView from "../../base/ui/CCMUIView";
import { ccmLog } from "../../base/utils/CCMLog";

// 登录注册界面tab
export enum LoginRegisterTab {
    LOGIN,
    REGISTER
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginRegisterView extends CCMUIView {

    @property(cc.ToggleContainer)
    tabContainer: cc.ToggleContainer = null;

    @property(cc.Node)
    loginLayer: cc.Node = null;

    @property(cc.Toggle)
    rememberMeToggle: cc.Toggle = null;

    @property(cc.EditBox)
    login_phoneNumEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    login_passwordEditBox: cc.EditBox = null;

    @property(cc.Toggle)
    login_passwordVisibleBtn: cc.Toggle = null;

    @property(cc.Node)
    registerLayer: cc.Node = null;

    @property(cc.Toggle)
    announceToggle: cc.Toggle = null;

    @property(cc.EditBox)
    register_phoneNumEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    register_passwordEditBox: cc.EditBox = null;

    @property(cc.Toggle)
    register_passwordVisibleBtn: cc.Toggle = null;

    public onOpen(fromUIID: number, uiArgs: CCMIUIArgs): void {
        let tabId = uiArgs.userOptions.tabId;
        this.selectTab(tabId);
    }

    private onTabSelected(tab: cc.Toggle) {
        switch (tab.node.name) {
            case "login":
                this.showTabContent(LoginRegisterTab.LOGIN);
                break;
            case "register":
                this.showTabContent(LoginRegisterTab.REGISTER);
                break;
            default:
                ccmLog.warn("onTabSelected unknown tab name: " + tab.node.name);
                break;
        }
    }

    private onLoginRegisterTextClick(event: cc.Event.EventTouch, customData: string) {
        this.selectTab(parseInt(customData));
    }

    private selectTab(tabId: LoginRegisterTab) {
        switch (tabId) {
            case LoginRegisterTab.LOGIN:
            case LoginRegisterTab.REGISTER:
                this.tabContainer.toggleItems[tabId].isChecked = true;
                this.showTabContent(tabId);
                break;
            default:
                ccmLog.warn("selectTab unknown tab: " + tabId);
                break;
        }
    }

    private showTabContent(tab: LoginRegisterTab) {
        switch (tab) {
            case LoginRegisterTab.LOGIN:
                this.loginLayer.active = true;
                this.registerLayer.active = false;
                break;
            case LoginRegisterTab.REGISTER:
                this.loginLayer.active = false;
                this.registerLayer.active = true;
                break;
            default:
                ccmLog.warn("showTabContent unknown tab: " + tab);
                break;
        }
    }

    private clearPhoneNum(tabId: LoginRegisterTab) {
        switch (tabId) {
            case LoginRegisterTab.LOGIN:
                this.login_phoneNumEditBox.string = "";
                break;
            case LoginRegisterTab.REGISTER:
                this.register_phoneNumEditBox.string = "";
                break;
            default:
                ccmLog.warn("clearPhoneNum unknown tab: " + tabId);
                break;
        }
    }

    private onClearPhoneNumBtnClick(event: cc.Event.EventTouch, customData: string) {
        let tabId = parseInt(customData);
        this.clearPhoneNum(tabId);
    }

    private changePasswordVisible(tabId: LoginRegisterTab, isVisible?: boolean) {
        switch (tabId) {
            case LoginRegisterTab.LOGIN:
                if (undefined === isVisible) {
                    isVisible = !this.login_passwordVisibleBtn.isChecked;
                }
                this.login_passwordEditBox.inputFlag = isVisible ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD;
                break;
            case LoginRegisterTab.REGISTER:
                if (undefined === isVisible) {
                    isVisible = !this.register_passwordVisibleBtn.isChecked;
                }
                this.register_passwordEditBox.inputFlag = isVisible ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD;
                break;
            default:
                ccmLog.warn("changePasswordVisible unknown tab: " + tabId);
                break;
        }
    }

    private onPasswordVisibleBtnClick(target: cc.Toggle, customData: string) {
        let tabId = parseInt(customData);
        this.changePasswordVisible(tabId);
    }

    private onGuestBtnClick(event: cc.Event.EventTouch, customData: string) {
        // TODO: 实现游客登录逻辑
        ccmLog.log("onGuestBtnClick");
    }

    private onCloseBtnClick(event: cc.Event.EventTouch, customData: string) {
        uiMgr.close(this);
    }
}
