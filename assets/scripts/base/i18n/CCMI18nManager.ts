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
    EN,
    TH,
}

export const LANGUAGE_KEYS = [
    "en",
    "th",
];

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

    private _languageId: CCMLanguageType = CCMLanguageType.EN;   // 当前语言
    public get languageId(): CCMLanguageType { return this._languageId; }
    public get language(): string { return LANGUAGE_KEYS[this._languageId]; }

    private _textConf: Map<number, any> = new Map();        // 文本语言包
    private _textureConf: Map<number, any> = new Map();     // 图片语言包
    private _state: CCMI18nState = CCMI18nState.UNINIT;           // 状态
    public get state(): CCMI18nState { return this._state; }

    private _compSet: Set<CCMI18nComponent> = new Set();    // i18n组件集合

    public languageKey2Id(key: string): CCMLanguageType {
        let index = LANGUAGE_KEYS.indexOf(key);
        if (-1 == index) {
            return CCMLanguageType.EN;
        }
        return index as CCMLanguageType;
    }

    public setLanguage(langId: CCMLanguageType): Promise<{ isSuccess: boolean, curLangId: CCMLanguageType }> {
        return new Promise((resolve, reject) => {
            if (CCMI18nState.CONFIG_LOADING == this._state) {
                ccmLog.warn("i18n config is loading, please wait...");
                reject({ isSuccess: false, curLangId: this._languageId });
                return;
            }

            let oldLangId = this._languageId;
            let newLangId = langId;
            if (oldLangId === newLangId && CCMI18nState.UNINIT !== this._state) {
                reject({ isSuccess: false, curLangId: this._languageId });
                return;
            }

            this._state = CCMI18nState.CONFIG_LOADING;
            this.loadLanguage(newLangId)
                .then((val) => {
                    this._languageId = newLangId;
                    this._state = CCMI18nState.CONFIG_LOAD_SUCCESS;
                    this.reloadAllComponent();
                    evtMgr.raiseEvent(CCMEvent.OPERATE_SET_LANGUAGE, this._languageId);
                    resolve({ isSuccess: true, curLangId: this._languageId });
                })
                .catch((err) => {
                    this._state = CCMI18nState.CONFIG_LOAD_FAILED;
                    reject({ isSuccess: false, curLangId: this._languageId });
                });
        });
    }

    // 是否已加载指定语言配置
    public isLanguageLoaded(langId?: CCMLanguageType): boolean {
        let checkLangId = (undefined != langId) ? langId : this._languageId;
        return this._textConf.has(checkLangId) || this._textureConf.has(checkLangId);
    }

    // 加载指定语言配置
    public loadLanguage(langId: CCMLanguageType): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.isLanguageLoaded(langId)) {
                resolve(true);
                return;
            }

            let resArr: string[] = [];
            let lang = LANGUAGE_KEYS[langId];
            resArr.push(`i18n/${lang}/configs/text_${lang}`);
            resArr.push(`i18n/${lang}/configs/texture_${lang}`);
            resLoader.load(resArr, cc.JsonAsset, (err: Error, assets: cc.JsonAsset[]) => {
                if (err) {
                    ccmLog.error(err);
                    reject(false);
                    return;
                }

                // 长久保存，防止意外释放
                if (CCMDefaultKeeper.inst) {
                    CCMDefaultKeeper.inst.cacheAsset(assets[0]);
                    CCMDefaultKeeper.inst.cacheAsset(assets[1]);
                }

                this._textConf.set(langId, assets[0].json);
                this._textureConf.set(langId, assets[1].json);
                resolve(true);
            });
        });
    }

    // 获取文本语言值
    public getTextValue(key: string, langId?: CCMLanguageType, ...args: any[]) {
        let checkLangId = (undefined !== langId && null !== langId) ? langId : this._languageId;
        let jsonObj = this._textConf.get(checkLangId);
        let text = jsonObj[key];
        if (text && args.length > 0) {
            return CCMUtil.replacePlaceholder(text, "%s", ...args);
        } else {
            return text || `${checkLangId}_${key}`;
        }
    }

    // 获取图片语言值
    public getTextureValue(key: string, langId?: CCMLanguageType, ...args: any[]) {
        let checkLangId = (undefined !== langId && null !== langId) ? langId : this._languageId;
        let jsonObj = this._textureConf.get(checkLangId);
        let text = jsonObj[key];
        if (text && args.length > 0) {
            return CCMUtil.replacePlaceholder(text, "%s", ...args);
        } else {
            return text || `${checkLangId}_${key}`;
        }
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
                comp.languageId = this._languageId;
            } else {
                this._compSet.delete(comp);
            }
        });
    }
}

export const i18nMgr = CCMI18nManager.inst;