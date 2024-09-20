/*
*   事件管理器，事件的监听、触发、移除
*/

import { ccmLog } from "../utils/CCMLog";

export type EventManagerCallFunc = (eventName: string, eventData: any) => void;
interface CallBackTarget {
    callBack: EventManagerCallFunc,
    target: any,
    priority: number,   // 数值越大，优先级越高
}

// 消息执行顺序(降序排列)
function sortListener(a: CallBackTarget, b: CallBackTarget): number {
    return b.priority - a.priority;
}

export class CCMEventManager {
    private static _instance: CCMEventManager = null;
    private constructor() { }
    public static get inst(): CCMEventManager {
        if (!this._instance) {
            this._instance = new CCMEventManager();
        }
        return this._instance;
    }

    private _eventListeners: { [key: string]: CallBackTarget[] } = {};

    private _getEventListenersIndex(eventName: string, callBack: EventManagerCallFunc, target?: any): number {
        let index = -1;
        for (let i = 0, len = this._eventListeners[eventName].length; i < len; i++) {
            let iterator = this._eventListeners[eventName][i];
            if (iterator.callBack == callBack && (!target || iterator.target == target)) {
                index = i;
                break;
            }
        }
        return index;
    }

    public addEventListener(eventName: string, callBack: EventManagerCallFunc, target?: any, priority: number = 0): boolean {
        if (!eventName) {
            ccmLog.warn("eventName is empty" + eventName);
            return false;
        }

        if (null == callBack) {
            ccmLog.log('addEventListener callBack is nil');
            return false;
        }
        let callTarget: CallBackTarget = { callBack: callBack, target: target, priority: priority };
        if (null == this._eventListeners[eventName]) {
            this._eventListeners[eventName] = [callTarget];

        } else {
            let index = this._getEventListenersIndex(eventName, callBack, target);
            if (-1 == index) {
                this._eventListeners[eventName].push(callTarget);
            }
            if (priority != 0) this._eventListeners[eventName].sort(sortListener);
        }

        return true;
    }

    public setEventListener(eventName: string, callBack: EventManagerCallFunc, target?: any, priority: number = 0): boolean {
        if (!eventName) {
            ccmLog.warn("eventName is empty" + eventName);
            return false;
        }

        if (null == callBack) {
            ccmLog.log('setEventListener callBack is nil');
            return false;
        }
        let callTarget: CallBackTarget = { callBack: callBack, target: target, priority: priority };
        this._eventListeners[eventName] = [callTarget];
        return true;
    }

    public removeEventListener(eventName: string, callBack: EventManagerCallFunc, target?: any) {
        if (null != this._eventListeners[eventName]) {
            let index = this._getEventListenersIndex(eventName, callBack, target);
            if (-1 != index) {
                this._eventListeners[eventName].splice(index, 1);
            }
        }
    }

    public raiseEvent(eventName: string, eventData?: any) {
        ccmLog.log(`==================== raiseEvent ${eventName} begin | ${JSON.stringify(eventData)}`);
        if (null != this._eventListeners[eventName]) {
            // 将所有回调提取出来，再调用，避免调用回调的时候操作了事件的删除
            let callbackList: CallBackTarget[] = [];
            for (let i = 0, len = this._eventListeners[eventName].length; i < len; i++) {
                let iterator = this._eventListeners[eventName][i];
                callbackList.push({ callBack: iterator.callBack, target: iterator.target, priority: iterator.priority });
            }
            for (let i = 0, len = callbackList.length; i < len; i++) {
                let iterator = callbackList[i];
                iterator.callBack.call(iterator.target, eventName, eventData);
            }
        }
        ccmLog.log(`==================== raiseEvent ${eventName} end`);
    }
}

export let evtMgr = CCMEventManager.inst;