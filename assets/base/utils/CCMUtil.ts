/**
 * 通用工具类
 */

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
}
