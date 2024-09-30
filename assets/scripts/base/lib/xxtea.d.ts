declare module 'xxtea' {
    export function utf8Encode(str: string): string;
    export function utf8Decode(str: string): string;
    export function encrypt(data: string, key: string): string;
    export function encryptToBase64(data: string, key: string): string;
    export function decrypt(data: string, key: string): string;
    export function decryptFromBase64(data: string, key: string): string;

    const xxtea: {
        utf8Encode: typeof utf8Encode;
        utf8Decode: typeof utf8Decode;
        encrypt: typeof encrypt;
        encryptToBase64: typeof encryptToBase64;
        decrypt: typeof decrypt;
        decryptFromBase64: typeof decryptFromBase64;
    };
    export default xxtea;
}
