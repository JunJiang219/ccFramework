/**
 * 音效管理
 */

import { resLoader } from "../res/CCMResLoader";
import { ccmLog } from "../utils/CCMLog";

export interface CCMIAudioPlayOptions {
    loop?: boolean;
    baseVolume?: number;        // 基础音量
    bundleName?: string;
    audioName?: string;
}

export default class CCMAudioManager {

    private static _instance: CCMAudioManager;
    private constructor() { }
    public static get inst(): CCMAudioManager {
        if (!CCMAudioManager._instance) {
            CCMAudioManager._instance = new CCMAudioManager();
        }
        return CCMAudioManager._instance;
    }

    private _bgVolume: number = 1;
    public get bgVolume() { return this._bgVolume; }
    public set bgVolume(value: number) {
        if (value <= 0) {
            this._bgVolume = 0.0;
        } else if (value >= 1) {
            this._bgVolume = 1.0;
        } else {
            this._bgVolume = value;
        }
        if (this._bgmId < 0) return;

        // 更新背景音乐音量
        let volume = this._bgVolume * this._bgmBaseVolume;
        cc.audioEngine.setVolume(this._bgmId, volume);
    }

    private _effVolume: number = 1;
    public get effVolume() { return this._effVolume; }
    public set effVolume(value: number) {
        if (value <= 0) {
            this._effVolume = 0.0;
        } else if (value >= 1) {
            this._effVolume = 1.0;
        } else {
            this._effVolume = value;
        }

        // 更新音效音量
        this._effPlayMap.forEach((playOptions, effId) => {
            let volume = playOptions.baseVolume * this._effVolume;
            cc.audioEngine.setVolume(effId, volume);
        });
    }

    private _bgmId: number = -1;
    private _bgmBaseVolume: number = 1;
    private _effPlayMap: Map<number, CCMIAudioPlayOptions> = new Map();

    // 播放背景音乐，同一时间只能播放一首背景音乐
    public playBGM(name: string, options?: CCMIAudioPlayOptions) {
        this.stopBGM();
        let bundleName = options?.bundleName || "resources";
        resLoader.load(name, cc.AudioClip, (err: Error, audio: cc.AudioClip) => {
            if (err) {
                ccmLog.log(err);
                return;
            }

            this._bgmBaseVolume = options?.baseVolume || 1.0;
            let loop = options?.loop || true;
            let volume = this._bgmBaseVolume * this._bgVolume;
            this._bgmId = cc.audioEngine.play(audio, loop, volume);
        }, bundleName);
    }

    // 暂停背景音乐
    public pauseBGM() {
        if (this._bgmId < 0) return;
        cc.audioEngine.pause(this._bgmId);
    }

    // 恢复背景音乐
    public resumeBGM() {
        if (this._bgmId < 0) return;
        cc.audioEngine.resume(this._bgmId);
    }

    // 停止背景音乐
    public stopBGM() {
        if (this._bgmId < 0) return;
        cc.audioEngine.stop(this._bgmId);
        this._bgmId = -1;
    }

    // 播放音效
    public playEff(name: string, options?: CCMIAudioPlayOptions) {
        // TODO: 播放音效
        let saveOptions: CCMIAudioPlayOptions = {};
        saveOptions.loop = options?.loop || false;
        saveOptions.baseVolume = options?.baseVolume || 1.0;
        saveOptions.bundleName = options?.bundleName || "resources";
        saveOptions.audioName = name;

        resLoader.load(name, cc.AudioClip, (err: Error, audio: cc.AudioClip) => {
            if (err) {
                ccmLog.log(err);
                return;
            }

            let loop = saveOptions.loop;
            let volume = (saveOptions.baseVolume || 1.0) * this._effVolume;
            let effId = cc.audioEngine.play(audio, loop, volume);
            if (effId >= 0) {
                this._effPlayMap.set(effId, options);
                cc.audioEngine.setFinishCallback(effId, () => {
                    this._effPlayMap.delete(effId);
                });
            }
        }, saveOptions.bundleName);
    }

    // 停止指定音效
    public stopEff(name: string) {
        this._effPlayMap.forEach((playOptions, effId) => {
            if (playOptions.audioName === name) {
                cc.audioEngine.stop(effId);
                this._effPlayMap.delete(effId);
            }
        });
    }

    // 停止所有音效
    public stopAllEffs() {
        this._effPlayMap.forEach((playOptions, effId) => {
            cc.audioEngine.stop(effId);
        });
        this._effPlayMap.clear();
    }
}

export const audioMgr = CCMAudioManager.inst;
