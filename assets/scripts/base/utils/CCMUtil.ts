/**
 * 通用工具类
 */

import { default as FingerprintJS } from '@fingerprintjs/fingerprintjs';

export default class CCMUtil {

    /**
     * 快速获取某个数据对象中深层 key 对应的值
     * @param src 数据对象
     * @param key 要获取值对应的 key，层级通过 # 分割
     */
    public static key4Property(src: Object, key: string) {
        if (!src) return undefined;
        let keys = key.split('#');
        for (let i = 0, j = keys.length; i < j; i++) {
            src = src[keys[i]];
            if (typeof src == 'object' && src != null) continue;
            if (i < j - 1) return undefined;
        }
        return src;
    }

    // 解析url参数
    public static urlParse(url: string) {
        let params = {};
        if (!url) {
            return params;
        }
        let name: string = "", value: string = "";
        let str: string = url; //取得整个地址栏
        let index: number = str.indexOf("?")
        str = str.substring(index + 1); //取得所有参数

        let arr = str.split("&"); //各个参数放到数组里
        for (let i = 0; i < arr.length; i++) {
            index = arr[i].indexOf("=");
            if (index > 0) {
                name = arr[i].substring(0, index);
                value = arr[i].substring(index + 1);
                params[name] = value;
            }
        }
        return params;
    }

    // 判断值是否在枚举中
    public static isValueInEnum(value: any, enumObj: any) {
        return Object.values(enumObj).includes(value);
    }

    /**
     * 获取设备唯一标识
     * @param storageKey 本地存储的 key
     * @returns 
     */
    public static async getDeviceId(storageKey?: string): Promise<string> {
        let deviceId = "";
        if (undefined != storageKey) deviceId = cc.sys.localStorage.getItem(storageKey);
        if (!deviceId) {
            const result = await FingerprintJS.load().then(fp => fp.get());
            deviceId = result.visitorId;
            if (undefined != storageKey) cc.sys.localStorage.setItem(storageKey, deviceId);
        }

        return Promise.resolve(deviceId);
    }
}
