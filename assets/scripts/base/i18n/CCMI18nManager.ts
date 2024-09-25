/**
 * 多语言管理器
 */

import DefaultKeeper from "../../manager/DefaultKeeper";
import { resLoader } from "../res/CCMResLoader";
import { CCMResReleaseTiming } from "../res/CCMResManager";
import { ccmLog } from "../utils/CCMLog";
import CCMUtil from "../utils/CCMUtil";
import CCMI18nComponent from "./CCMI18nComponent";

// 语言种类
export enum CCMLanguageType {
    EN = "en",
    TH = "th",
}

// 状态
export enum CCMI18nState {
    UNINIT,                     // 未初始化
    CONFIG_LOADING,             // 配置加载中
    CONFIG_LOAD_FAILED,         // 配置加载失败
    CONFIG_LOAD_SUCCESS,        // 配置加载完成
}

export default class CCMI18nManager {

    private static _instance: CCMI18nManager;
    private constructor() { }
    public static get inst(): CCMI18nManager {
        if (!CCMI18nManager._instance) {
            CCMI18nManager._instance = new CCMI18nManager();
        }
        return CCMI18nManager._instance;
    }

    private _language: string = "";   // 当前语言
    public get language(): string { return this._language; }

    private _textConf: Map<string, any> = new Map();        // 文本语言包
    private _textureConf: Map<string, any> = new Map();     // 图片语言包
    private _state: CCMI18nState = CCMI18nState.UNINIT;           // 状态
    public get state(): CCMI18nState { return this._state; }

    private _compSet: Set<CCMI18nComponent> = new Set();    // i18n组件集合

    public setLanguage(lang: string, finishCb?: (curLang: string) => void) {
        if (CCMI18nState.CONFIG_LOADING == this._state) {
            ccmLog.warn("i18n config is loading, please wait...");
            finishCb && finishCb(this._language);
            return;
        }
        let langSupport = CCMUtil.isValueInEnum(lang, CCMLanguageType);
        let oldLang = this._language;
        let newLang = langSupport ? lang : CCMLanguageType.EN;
        if (oldLang === newLang) {
            finishCb && finishCb(this._language);
            return;
        }
        this._language = newLang;

        let resArr: string[] = [];
        resArr.push(`i18n/${this._language}/configs/text_${this._language}`);
        resArr.push(`i18n/${this._language}/configs/texture_${this._language}`);
        this._state = CCMI18nState.CONFIG_LOADING;
        resLoader.load(resArr, cc.JsonAsset, (err: Error, assets: cc.JsonAsset[]) => {
            if (err) {
                this._language = oldLang;
                this._state = CCMI18nState.CONFIG_LOAD_FAILED;
                ccmLog.error(err);
                finishCb && finishCb(this._language);
                return;
            }

            // 长久保存，防止意外释放
            DefaultKeeper.inst.cacheAsset(assets[0]);
            DefaultKeeper.inst.cacheAsset(assets[1]);

            this._textConf.set(this._language, assets[0].json);
            this._textureConf.set(this._language, assets[1].json);
            this._state = CCMI18nState.CONFIG_LOAD_SUCCESS;
            this.reloadAllComponent();
            finishCb && finishCb(this._language);
        });
    }

    // 获取文本语言值
    public getTextValue(key: string, lang?: string) {
        let checkLang = lang || this._language;
        let jsonObj = this._textConf.get(checkLang);
        if (!jsonObj) return `not found language ${checkLang}`;
        return jsonObj[key] || `not found ${key}`;
    }

    // 获取图片语言值
    public getTextureValue(key: string, lang?: string) {
        let checkLang = lang || this._language;
        let jsonObj = this._textureConf.get(checkLang);
        if (!jsonObj) return `not found language ${checkLang}`;
        return jsonObj[key] || `not found ${key}`;
    }

    public addComp(comp: CCMI18nComponent) {
        this._compSet.add(comp);
    }

    public delComp(comp: CCMI18nComponent) {
        this._compSet.delete(comp);
    }

    // 重载所有组件管理的多语言文本、图片
    public reloadAllComponent() {
        this._compSet.forEach((comp) => {
            if (cc.isValid(comp)) {
                comp.reloadLabels();
                comp.reloadRichTexts();
                comp.reloadSprites();
            } else {
                this._compSet.delete(comp);
            }
        });
    }
}

export const i18nMgr = CCMI18nManager.inst;