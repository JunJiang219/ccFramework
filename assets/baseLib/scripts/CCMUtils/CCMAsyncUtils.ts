/**
 * 异步函数工具类   
 */

export interface IAsyncUtilsOptions {
    promiseKey: string;
    promiseInstance?: Promise<void>;
    promiseResolve?: () => void;
    promiseReject?: (error: any) => void;
}

export class CCMAsyncUtils {

    private static _runningPromises: Map<string, IAsyncUtilsOptions> = new Map<string, IAsyncUtilsOptions>();

    /**
     * 等待一段时间
     * @param ms 等待时间（毫秒）
     * @returns 
     */
    public static wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取一个唯一的Promise
     * @param key 唯一标识
     * @returns Promise<void>
     */
    public static getPromise(key: string): Promise<void> {
        if (this._runningPromises.has(key)) {
            return this._runningPromises.get(key).promiseInstance;
        }

        let options: IAsyncUtilsOptions = {
            promiseKey: key,
        };

        options.promiseInstance = new Promise((resolve, reject) => {
            options.promiseResolve = resolve;
            options.promiseReject = reject;
        });
        this._runningPromises.set(key, options);

        return options.promiseInstance;
    }

    /**
     * 解决Promise
     * @param key 唯一标识
     * @param autoDelete 是否自动删除
     * @returns void
     */
    public static resolvePromise(key: string, autoDelete: boolean = false): void {
        if (this._runningPromises.has(key)) {
            let options = this._runningPromises.get(key);
            options.promiseResolve?.();
            options.promiseResolve = null;
            options.promiseReject = null;
            if (autoDelete) this._runningPromises.delete(key);
        }
    }

    /**
     * 拒绝Promise
     * @param key 唯一标识
     * @param error 错误信息
     * @param autoDelete 是否自动删除
     * @returns void
     */
    public static rejectPromise(key: string, error: any, autoDelete: boolean = false): void {
        if (this._runningPromises.has(key)) {
            let options = this._runningPromises.get(key);
            options.promiseReject?.(error);
            options.promiseResolve = null;
            options.promiseReject = null;
            if (autoDelete) this._runningPromises.delete(key);
        }
    }

    /**
     * 删除Promise
     * @param key 唯一标识
     * @returns void
     */
    public static deletePromise(key: string): void {
        if (this._runningPromises.has(key)) {
            this._runningPromises.delete(key);
        }
    }

    /**
     * 清除所有Promise
     * @returns void
     */
    public static clearPromises(): void {
        this._runningPromises.clear();
    }
}
