/**
 * 加解密工具类
 */

declare const XXTEA: any;

export default class CCMCryptoUtil {
    // 将字符串编码为 Base64
    public static encodeBase64(str: string): string {
        // 强制类型转换为 UTF-8 编码
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // 将 Base64 解码为字符串
    public static decodeBase64(base64Str: string): string {
        const binaryString = atob(base64Str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }

    public static encodeXXTEA(data: string, key: string): string {
        return XXTEA.encrypt(data, key);
    }

    public static decodeXXTEA(data: string, key: string): string {
        return XXTEA.decrypt(data, key);
    }
}
