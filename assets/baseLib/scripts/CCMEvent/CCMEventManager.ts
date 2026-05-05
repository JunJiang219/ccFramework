/*
*   事件管理器，事件的监听、触发、移除
*/

import CCMLogger from "../CCMLog/CCMLogger";
import CCMSingleton from "../CCMBase/CCMSingleton";

// 事件优先级（数值越大，优先级越高）
export enum CCMEventPriority {
    P0,
    P1,
    P2,
    P3,
    P4,
    P5,
    P6,
    P7,
    P8,
    P9,
}

export type CCMEventCallFunc = (eventName: string, eventData: any) => void;

interface CCMCallBackTarget {
    callBack: CCMEventCallFunc,
    target: any,
    priority: number,   // 数值越大，优先级越高
}

// 消息执行顺序(降序排列)
function sortListener(a: CCMCallBackTarget, b: CCMCallBackTarget): number {
    return b.priority - a.priority;
}

export class CCMEventManager extends CCMSingleton {
    protected constructor() { super(); }

    private _eventListeners: { [key: string]: CCMCallBackTarget[] } = {};

    /** 清空所有事件监听 */
    public override reset(): void {
        this._eventListeners = {};
    }

    private getEventListenersIndex(eventName: string, callBack: CCMEventCallFunc, target?: any): number {
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

    public addEventListener(eventName: string, callBack: CCMEventCallFunc, target?: any, priority: number = 0): boolean {
        if (!eventName) {
            CCMLogger.getInstance().log("eventName is empty" + eventName);
            return false;
        }

        if (null == callBack) {
            CCMLogger.getInstance().log('addEventListener callBack is nil');
            return false;
        }
        let callTarget: CCMCallBackTarget = { callBack: callBack, target: target, priority: priority };
        if (null == this._eventListeners[eventName]) {
            this._eventListeners[eventName] = [callTarget];
        } else {
            let index = this.getEventListenersIndex(eventName, callBack, target);
            if (-1 == index) {
                this._eventListeners[eventName].push(callTarget);
            }
            if (priority != 0) this._eventListeners[eventName].sort(sortListener);
        }

        return true;
    }

    public setEventListener(eventName: string, callBack: CCMEventCallFunc, target?: any, priority: number = 0): boolean {
        if (!eventName) {
            CCMLogger.getInstance().log("eventName is empty" + eventName);
            return false;
        }

        if (null == callBack) {
            CCMLogger.getInstance().log('setEventListener callBack is nil');
            return false;
        }
        let callTarget: CCMCallBackTarget = { callBack: callBack, target: target, priority: priority };
        this._eventListeners[eventName] = [callTarget];
        return true;
    }

    public removeEventListener(eventName: string, callBack: CCMEventCallFunc, target?: any) {
        if (null != this._eventListeners[eventName]) {
            let index = this.getEventListenersIndex(eventName, callBack, target);
            if (-1 != index) {
                this._eventListeners[eventName].splice(index, 1);
            }
        }
    }

    public removeByTarget(target: any) {
        if (!target) return;
        for (const eventName in this._eventListeners) {
            const listeners = this._eventListeners[eventName];
            if (!listeners) continue;
            for (let i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i].target === target) {
                    listeners.splice(i, 1);
                }
            }
            // 如果该事件下所有监听都被移除，则删除对应事件名键值，防止空列表占资源
            if (this._eventListeners[eventName].length === 0) {
                delete this._eventListeners[eventName];
            }
        }
    }

    public raiseEvent(eventName: string, eventData?: any) {
        CCMLogger.getInstance().log(`==================== raiseEvent ${eventName} begin | ${JSON.stringify(eventData)}`);
        if (null != this._eventListeners[eventName]) {
            // 将所有回调提取出来，再调用，避免调用回调的时候操作了事件的删除
            let callbackList: CCMCallBackTarget[] = [];
            for (let i = 0, len = this._eventListeners[eventName].length; i < len; i++) {
                let iterator = this._eventListeners[eventName][i];
                callbackList.push({ callBack: iterator.callBack, target: iterator.target, priority: iterator.priority });
            }
            for (let i = 0, len = callbackList.length; i < len; i++) {
                let iterator = callbackList[i];
                if (iterator.target) {
                    iterator.callBack.call(iterator.target, eventName, eventData);
                } else {
                    iterator.callBack(eventName, eventData);
                }
            }
        }
        CCMLogger.getInstance().log(`==================== raiseEvent ${eventName} end`);
    }
}