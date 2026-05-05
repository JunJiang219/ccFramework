/**
 * 单例基类
 *
 * 用法：
 *   class MyManager extends CCMSingleton {
 *       protected constructor() { super(); }
 *       // ...
 *   }
 *   MyManager.getInstance().doSomething();
 *
 * 原理：
 *   利用 Map 以构造函数本身为 key 存储各子类实例，
 *   this: Function & { prototype: T } 这个类型约束兼容 protected 构造函数，
 *   同时让 TypeScript 能正确推断 getInstance() 的返回类型。
 */
export default abstract class CCMSingleton {
    /** 以子类构造函数为 key，存储所有单例实例 */
    private static readonly _instanceMap: Map<Function, CCMSingleton> = new Map();

    protected constructor() {}

    /**
     * 获取子类单例实例
     * 直接用 MyClass.getInstance() 调用，返回值自动推断为 MyClass 类型
     */
    public static getInstance<T extends CCMSingleton>(this: Function & { prototype: T }): T {
        const ctor = this as Function;
        if (!CCMSingleton._instanceMap.has(ctor)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            CCMSingleton._instanceMap.set(ctor, new (ctor as any)());
        }
        return CCMSingleton._instanceMap.get(ctor) as T;
    }

    /**
     * 重置实例内部状态，实例本身继续存活（子类按需覆写）
     * 适用场景：场景切换、游戏重开
     */
    public reset(): void {}

    /**
     * 销毁当前类的单例实例：先执行 reset 清理状态，再从缓存中移除
     * 下次调用 getInstance() 时会重新创建新实例
     * 用法：MyClass.destroyInstance()
     */
    public static destroyInstance(this: Function): void {
        const instance = CCMSingleton._instanceMap.get(this);
        if (instance) {
            instance.reset();
            CCMSingleton._instanceMap.delete(this);
        }
    }

    /**
     * 销毁所有单例实例：对每个实例执行 reset，然后清空缓存
     * 适用场景：热重载、彻底重启
     */
    public static destroyAll(): void {
        CCMSingleton._instanceMap.forEach(instance => instance.reset());
        CCMSingleton._instanceMap.clear();
    }
}
