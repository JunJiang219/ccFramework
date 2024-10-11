/**
 * 数据存储管理器
 */

export default class StorageManager {

    private static _instance: StorageManager;
    private constructor() { }
    public static get inst(): StorageManager {
        if (!StorageManager._instance) {
            StorageManager._instance = new StorageManager();
        }
        return StorageManager._instance;
    }

    public saveString(key: string, value: string): void {
        cc.sys.localStorage.setItem(key, value);
    }

    public saveObject(key: string, value: Object): void {
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    }

    public getString(key: string): string | null {
        return cc.sys.localStorage.getItem(key);
    }

    public getObject(key: string): Object | null {
        const value = cc.sys.localStorage.getItem(key);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    }
}

export const storageMgr = StorageManager.inst;