/**
 * 多语言组件
 */

import { CCMResKeeper } from "../res/CCMResKeeper";
import { resLoader } from "../res/CCMResLoader";
import { CCMResReleaseTiming } from "../res/CCMResManager";
import { CCMResUtil } from "../res/CCMResUtil";
import { ccmLog } from "../utils/CCMLog";
import { CCMI18nState, CCMLanguageType, i18nMgr } from "./CCMI18nManager";

const { ccclass, property } = cc._decorator;

@ccclass("CCMI18nLabel")
export class CCMI18nLabel {
    @property(cc.Label)
    public target: cc.Label = null;

    @property(cc.String)
    public key: string = "";
}

@ccclass("CCMI18nRichText")
export class CCMI18nRichText {
    @property(cc.RichText)
    public target: cc.RichText = null;

    @property(cc.String)
    public key: string = "";
}

@ccclass("CCMI18nSprite")
export class CCMI18nSprite {
    @property(cc.Sprite)
    public target: cc.Sprite = null;

    @property(cc.String)
    public key: string = "";

    @property(CCMResKeeper)
    resKeeper: CCMResKeeper = null;
}

@ccclass
@executeInEditMode
@disallowMultiple
@menu("自定义/CCMI18nComponent")
export default class CCMI18nComponent extends cc.Component {

    @property([CCMI18nLabel])
    public labels: CCMI18nLabel[] = [];

    @property([CCMI18nRichText])
    public richTexts: CCMI18nRichText[] = [];

    @property([CCMI18nSprite])
    public sprites: CCMI18nSprite[] = [];

    // 是否修正数组，删除未填充的元素
    private _fixArray: boolean = false;
    @property(cc.Boolean)
    get fixArray() { return this._fixArray; }
    set fixArray(value: boolean) {
        this._refillArray(this.labels);
        this._refillArray(this.richTexts);
        this._refillArray(this.sprites);
    }

    // 修正数组，删除未填充的元素
    private _refillArray<T>(array: T[]) {
        // Filter出已经填充的元素
        const filledArray = array.filter(item => item && this._isFilled(item));
        array.length = 0; // 清空原数组
        array.push(...filledArray); // 用填充后的数组推入
    }

    // 数组元素是否已填充
    private _isFilled<T>(item: T): boolean {
        return (item as any).target || (item as any).key;
    }

    // 重载label
    public reloadLabels(): void {
        if (CCMI18nState.UNINIT == i18nMgr.state || CCMI18nState.CONFIG_LOADING == i18nMgr.state) return;
        this.labels.forEach(label => {
            if (label.target && label.key) {
                label.target.string = i18nMgr.getTextValue(label.key);
            }
        });
    }

    public reloadRichTexts(): void {
        if (CCMI18nState.UNINIT == i18nMgr.state || CCMI18nState.CONFIG_LOADING == i18nMgr.state) return;
        this.richTexts.forEach(label => {
            if (label.target && label.key) {
                label.target.string = i18nMgr.getTextValue(label.key);
            }
        });
    }

    public reloadSprites(): void {
        if (CCMI18nState.UNINIT == i18nMgr.state || CCMI18nState.CONFIG_LOADING == i18nMgr.state) return;
        this.sprites.forEach(sprite => {
            if (sprite.target && sprite.key) {
                let path = i18nMgr.getTextureValue(sprite.key);
                if (path) {
                    resLoader.load(path, cc.SpriteFrame, (err, spriteFrame) => {
                        if (err) {
                            ccmLog.log(err);
                            return;
                        }

                        let oldSpf = sprite.target.spriteFrame;
                        sprite.target.spriteFrame = spriteFrame;
                        let resKeeper = sprite.resKeeper || CCMResUtil.getResKeeper(sprite.target.node);
                        if (resKeeper) {
                            resKeeper.unCacheAsset(oldSpf);
                            resKeeper.cacheAsset(spriteFrame, { releaseTiming: CCMResReleaseTiming.ManualDelay });
                        }
                    });
                }
            }
        });
    }

    protected start(): void {
        i18nMgr.addComp(this);
        this.reloadLabels();
        this.reloadRichTexts();
        this.reloadSprites();
    }

    protected onDestroy(): void {
        i18nMgr.delComp(this);
    }
}

function executeInEditMode(target: typeof CCMI18nComponent): void | typeof CCMI18nComponent {
    // ccmLog.info(`${target.name} is executeInEditMode`);
}

function menu(arg0: string): (target: typeof CCMI18nComponent) => void | typeof CCMI18nComponent {
    return function (target: typeof CCMI18nComponent): void {
        // ccmLog.info(`menu item added: ${arg0} for ${target.name}`);
    };
}

function disallowMultiple(target: typeof CCMI18nComponent): void | typeof CCMI18nComponent {
    // ccmLog.info(`${target.name} disallowMultiple`);
}

