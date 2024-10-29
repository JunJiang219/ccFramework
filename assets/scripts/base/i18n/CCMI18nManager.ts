/**
 * 多语言管理器
 */

import { evtMgr } from "../common/CCMEventManager";
import { CCMEvent } from "../config/CCMEvent";
import CCMDefaultKeeper from "../res/CCMDefaultKeeper";
import { resLoader } from "../res/CCMResLoader";
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

    public setLanguage(lang: string): Promise<{ isSuccess: boolean, curLang: string }> {
        return new Promise((resolve, reject) => {
            if (CCMI18nState.CONFIG_LOADING == this._state) {
                ccmLog.warn("i18n config is loading, please wait...");
                reject({ isSuccess: false, curLang: this._language });
                return;
            }

            let langSupport = CCMUtil.isValueInEnum(lang, CCMLanguageType);
            let oldLang = this._language;
            let newLang = langSupport ? lang : CCMLanguageType.EN;
            if (oldLang === newLang) {
                reject({ isSuccess: false, curLang: this._language });
                return;
            }

            this._state = CCMI18nState.CONFIG_LOADING;
            this.loadLanguage(newLang)
                .then((val) => {
                    this._language = newLang;
                    this._state = CCMI18nState.CONFIG_LOAD_SUCCESS;
                    this.reloadAllComponent();
                    evtMgr.raiseEvent(CCMEvent.OPERATE_SET_LANGUAGE, this._language);
                    resolve({ isSuccess: true, curLang: this._language });
                })
                .catch((err) => {
                    this._state = CCMI18nState.CONFIG_LOAD_FAILED;
                    reject({ isSuccess: false, curLang: this._language });
                });
        });
    }

    // 是否已加载指定语言配置
    public isLanguageLoaded(lang?: string): boolean {
        let checkLang = lang || this._language;
        return this._textConf.has(checkLang) || this._textureConf.has(checkLang);
    }

    // 加载指定语言配置
    public loadLanguage(lang: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.isLanguageLoaded(lang)) {
                resolve(true);
                return;
            }

            let resArr: string[] = [];
            resArr.push(`i18n/${lang}/configs/text_${lang}`);
            resArr.push(`i18n/${lang}/configs/texture_${lang}`);
            resLoader.load(resArr, cc.JsonAsset, (err: Error, assets: cc.JsonAsset[]) => {
                if (err) {
                    ccmLog.error(err);
                    reject(false);
                    return;
                }

                // 长久保存，防止意外释放
                CCMDefaultKeeper.inst.cacheAsset(assets[0]);
                CCMDefaultKeeper.inst.cacheAsset(assets[1]);

                this._textConf.set(lang, assets[0].json);
                this._textureConf.set(lang, assets[1].json);
                resolve(true);
            });
        });
    }

    // 获取文本语言值
    public getTextValue(key: string, lang?: string) {
        let checkLang = lang || this._language;
        let jsonObj = this._textConf.get(checkLang);
        return jsonObj[key] || `${checkLang}_${key}`;
    }

    // 获取图片语言值
    public getTextureValue(key: string, lang?: string) {
        let checkLang = lang || this._language;
        let jsonObj = this._textureConf.get(checkLang);
        return jsonObj[key] || `${checkLang}_${key}`;
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