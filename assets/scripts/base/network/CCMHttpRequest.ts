/**
 * http消息请求类
 */

import { ccmLog } from "../utils/CCMLog";

export interface CCMIHttpReqInfo {
    method: string;                         // 请求方法
    url: string;                            // 请求地址
    headers: { [key: string]: string };     // 请求头
    data?: any;                             // 请求数据
    timeout?: number;                       // 请求超时时间（单位：毫秒）
    timeoutRetry?: number;                  // 超时重试次数
    retryInterval?: number;                 // 超时重试间隔（单位：毫秒）
    reqStatus?: CCMHttpReqStatus;           // 请求状态
}

// 请求状态枚举
export enum CCMHttpReqStatus {
    UNSTART,        // 未开始
    PROCESSING,     // 进行中
    SUCCESS,        // 成功
    FAIL,           // 失败
    TIMEOUT,        // 超时
}

export default class CCMHttpRequest {

    private static _instance: CCMHttpRequest;
    private constructor() { }
    public static get inst(): CCMHttpRequest {
        if (!CCMHttpRequest._instance) {
            CCMHttpRequest._instance = new CCMHttpRequest();
        }
        return CCMHttpRequest._instance;
    }

    public send(reqInfo: CCMIHttpReqInfo): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!reqInfo.timeout) reqInfo.timeout = 5000;               // 默认超时时间为5秒
            if (!reqInfo.timeoutRetry) reqInfo.timeoutRetry = 0;        // 默认不重试
            if (!reqInfo.retryInterval) reqInfo.retryInterval = 1000;   // 默认重试间隔为1秒
            if (!reqInfo.reqStatus) reqInfo.reqStatus = CCMHttpReqStatus.UNSTART;

            const attemptRequest = (retryCount: number) => {
                if (0 === retryCount) reqInfo.reqStatus = CCMHttpReqStatus.PROCESSING;

                const xhr = new XMLHttpRequest();
                xhr.open(reqInfo.method.toUpperCase(), reqInfo.url, true);

                if (reqInfo.headers) {
                    for (let key in reqInfo.headers) {
                        xhr.setRequestHeader(key, reqInfo.headers[key]);
                    }
                }

                xhr.timeout = reqInfo.timeout;

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            reqInfo.reqStatus = CCMHttpReqStatus.SUCCESS;
                            resolve({ xhr, reqInfo });
                        } else {
                            reqInfo.reqStatus = CCMHttpReqStatus.FAIL;
                            reject({ xhr, reqInfo });
                        }
                    }
                };

                // 处理超时
                xhr.ontimeout = function () {
                    if (retryCount < reqInfo.timeoutRetry) {
                        ccmLog.log(`重试请求... 当前重试次数: ${retryCount + 1}`);
                        setTimeout(() => {
                            attemptRequest(retryCount + 1); // 递归调用以重试
                        }, reqInfo.retryInterval);
                    } else {
                        ccmLog.log('请求超时，重试次数已耗尽');
                        reqInfo.reqStatus = CCMHttpReqStatus.TIMEOUT;
                        reject({ xhr, reqInfo });
                    }
                };

                xhr.send(reqInfo.data);
            };

            attemptRequest(0);
        });
    }
}

export const httpReq = CCMHttpRequest.inst;