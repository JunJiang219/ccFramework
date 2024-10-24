/**
 * 加解密工具类
 */

import { Base64 } from "js-base64";
declare const XXTEA: any;

export default class CCMCryptoUtil {
    // 将字符串编码为 Base64
    public static base64_encode(str: string): string {
        // // 强制类型转换为 UTF-8 编码
        // const bytes = new TextEncoder().encode(str);
        // let binary = '';
        // for (let i = 0; i < bytes.length; i++) {
        //     binary += String.fromCharCode(bytes[i]);
        // }
        // return btoa(binary);
        return Base64.encode(str);
    }

    // 将 Base64 解码为字符串
    public static base64_decode(base64Str: string): string {
        // const binaryString = atob(base64Str);
        // const bytes = new Uint8Array(binaryString.length);
        // for (let i = 0; i < binaryString.length; i++) {
        //     bytes[i] = binaryString.charCodeAt(i);
        // }
        // return new TextDecoder().decode(bytes);
        return Base64.decode(base64Str);
    }

    public static xxtea_encrypt(data: string, key: string): string {
        return XXTEA.encrypt(data, key);
    }

    public static xxtea_decrypt(data: string, key: string): string {
        return XXTEA.decrypt(data, key);
    }

    public static xxtea_encryptToBase64(data: string, key: string): string {
        return XXTEA.encryptToBase64(data, key);
    }

    public static xxtea_decryptFromBase64(data: string, key: string): string {
        return XXTEA.decryptFromBase64(data, key);
    }
}
