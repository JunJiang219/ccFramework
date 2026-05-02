/**
 * CCMStateMachine —— 通用有限状态机 (Finite State Machine)
 *
 * 核心能力：
 * - 异步状态转换（支持 enter/exit 中的异步操作）
 * - 转换规则校验（限制合法的状态跳转路径）
 * - 状态锁（在非空闲状态屏蔽用户输入）
 * - 可打断（Turbo/快停场景下跳过动画）
 * - 强制跳转（断线恢复时直接定位到目标状态）
 *
 * 设计原则：
 *   状态机只负责"流程编排"，不包含具体业务逻辑。
 *   业务逻辑通过监听状态变更事件来响应。
 */

import CCMLogger from "../CCMLog/CCMLogger";

/**
 * 状态接口
 * 所有状态必须实现 name / onEnter / onExit
 */
export interface ICCMState {
    /** 状态唯一名称 */
    readonly name: string;

    /** 进入状态时调用 */
    onEnter(fromState: string, data?: any): void | Promise<void>;

    /** 每帧更新（可选，需要轮询逻辑的状态才实现） */
    onUpdate?(dt: number): void;

    /** 退出状态时调用 */
    onExit(toState: string): void | Promise<void>;

    /** 是否允许被打断（默认 false） */
    canInterrupt?(): boolean;
}

/** 状态变更回调签名 */
export type CCMStateChangeCallback = (fromState: string, toState: string, data?: any) => void;

/**
 * 通用状态机
 *
 * 使用方式：
 * ```
 * const fsm = new CCMStateMachine();
 * fsm.register(stateA, stateB, stateC);
 * fsm.addTransition('A', 'B', 'C');
 * fsm.addTransition('B', 'C');
 * await fsm.changeTo('A');
 * ```
 */
export class CCMStateMachine {
    /** 已注册的所有状态 */
    private _states = new Map<string, ICCMState>();
    /** 当前激活的状态 */
    private _current: ICCMState = null;
    /** 上一个状态名 */
    private _previous: string = null;
    /** 是否正在转换中（防止重入） */
    private _isTransitioning = false;
    /** 待执行的转换（暂存，当前转换完成后自动执行） */
    private _pendingTransition: { stateName: string; data?: any } | null = null;
    /** 状态锁（锁定时屏蔽用户输入） */
    private _locked = false;
    /** 合法转换规则: fromState → Set<toState> */
    private _transitions = new Map<string, Set<string>>();
    /** 状态变更监听器 */
    private _listeners: CCMStateChangeCallback[] = [];

    // ─────────────── 属性 ───────────────

    /** 当前状态名 */
    get currentState(): string {
        return this._current?.name ?? null;
    }

    /** 上一个状态名 */
    get previousState(): string {
        return this._previous;
    }

    /** 是否处于锁定状态 */
    get isLocked(): boolean {
        return this._locked;
    }

    /** 是否正在状态转换中 */
    get isTransitioning(): boolean {
        return this._isTransitioning;
    }

    // ─────────────── 注册 & 配置 ───────────────

    /** 注册一个或多个状态 */
    register(...states: ICCMState[]): this {
        for (const state of states) {
            this._states.set(state.name, state);
        }
        return this;
    }

    /**
     * 添加合法的转换规则
     * @param from 起始状态
     * @param to   允许到达的状态（可多个）
     *
     * 不调用此方法则默认允许所有转换
     */
    addTransition(from: string, ...to: string[]): this {
        if (!this._transitions.has(from)) {
            this._transitions.set(from, new Set());
        }
        const allowed = this._transitions.get(from)!;
        for (const t of to) {
            allowed.add(t);
        }
        return this;
    }

    // ─────────────── 状态切换 ───────────────

    /**
     * 切换到指定状态
     * @returns 是否成功切换
     */
    async changeTo(stateName: string, data?: any): Promise<boolean> {
        // 转换期间收到新请求 → 暂存，当前转换完成后自动执行
        if (this._isTransitioning) {
            if (this._pendingTransition) {
                CCMLogger.getInstance().warn(`[FSM] 转换中收到多次请求，"${this._pendingTransition.stateName}" 被 "${stateName}" 覆盖`);
            }
            this._pendingTransition = { stateName, data };
            return false;
        }

        const next = this._states.get(stateName);
        if (!next) {
            CCMLogger.getInstance().error(`[FSM] 状态 "${stateName}" 未注册`);
            return false;
        }

        const prevName = this._current?.name ?? null;

        // 已处于目标状态则跳过
        if (prevName === stateName) {
            return false;
        }

        // 校验转换规则
        if (prevName && !this.isAllowed(prevName, stateName)) {
            CCMLogger.getInstance().warn(`[FSM] 不允许从 "${prevName}" 转换到 "${stateName}"`);
            return false;
        }

        return this.executeTransition(prevName, next, data);
    }

    /**
     * 强制跳转（跳过转换规则校验）
     * 用于断线恢复等场景
     */
    async forceChangeTo(stateName: string, data?: any): Promise<boolean> {
        const next = this._states.get(stateName);
        if (!next) {
            CCMLogger.getInstance().error(`[FSM] 状态 "${stateName}" 未注册`);
            return false;
        }
        const prevName = this._current?.name ?? null;
        return this.executeTransition(prevName, next, data);
    }

    /** 执行实际的状态转换 */
    private async executeTransition(prevName: string, next: ICCMState, data?: any): Promise<boolean> {
        this._isTransitioning = true;

        try {
            // 退出当前状态
            if (this._current) {
                await this._current.onExit(next.name);
            }

            // 更新引用
            this._previous = prevName;
            this._current = next;

            // 【设计说明】
            // 广播 notifyListeners 放在 onExit 和 onEnter 之间，代表“状态已经变更，开始进入下一个状态”。
            // 这样业务监听者能及时得知已经切换到新状态，可以提前做准备，等 onEnter 真正进入后再做后续逻辑。
            //   - 如果放在 onEnter 之后，监听者会晚于目标状态 onEnter() 执行，在某些场景下（比如状态嵌套、依赖外部数据），可能影响初始化时机；
            //   - 放在 onExit 之前，则早于真正切换，不符合语义。
            // 所以放中间是权衡后的最佳时机：当前状态已结束，新状态即将 onEnter，通知外界马上可响应。

            CCMLogger.getInstance().info(`[FSM] 状态变更：从 "${prevName}" 到 "${next.name}"`);
            this.notifyListeners(prevName, next.name, data);

            // 进入新状态
            await next.onEnter(prevName, data);
        } finally {
            this._isTransitioning = false;
        }

        // 处理排队的转换请求
        if (this._pendingTransition) {
            const pending = this._pendingTransition;
            this._pendingTransition = null;
            await this.changeTo(pending.stateName, pending.data);
        }

        return true;
    }

    // ─────────────── 每帧更新 ───────────────

    /** 更新当前状态（需在游戏主循环中调用） */
    update(dt: number): void {
        if (!this._isTransitioning) {
            this._current?.onUpdate?.(dt);
        }
    }

    // ─────────────── 锁 & 打断 ───────────────

    /** 锁定（屏蔽用户输入） */
    lock(): void {
        this._locked = true;
    }

    /** 解锁 */
    unlock(): void {
        this._locked = false;
    }

    /** 当前状态是否可被打断 */
    tryInterrupt(): boolean {
        return this._current?.canInterrupt?.() ?? false;
    }

    // ─────────────── 查询 ───────────────

    /** 获取已注册的状态实例 */
    getState<T extends ICCMState>(name: string): T | undefined {
        return this._states.get(name) as T;
    }

    /** 判断当前是否处于某个状态 */
    isInState(name: string): boolean {
        return this._current?.name === name;
    }

    // ─────────────── 监听 ───────────────

    /** 注册状态变更监听 */
    onStateChanged(callback: CCMStateChangeCallback): void {
        this._listeners.push(callback);
    }

    /** 移除监听 */
    offStateChanged(callback: CCMStateChangeCallback): void {
        const idx = this._listeners.indexOf(callback);
        if (idx >= 0) this._listeners.splice(idx, 1);
    }

    // ─────────────── 生命周期 ───────────────

    /** 销毁状态机，释放所有引用 */
    destroy(): void {
        this._states.clear();
        this._transitions.clear();
        this._listeners.length = 0;
        this._current = null;
        this._previous = null;
        this._pendingTransition = null;
    }

    // ─────────────── 私有方法 ───────────────

    /** 检查转换是否被允许 */
    private isAllowed(from: string, to: string): boolean {
        if (this._transitions.size === 0) return true;
        const allowed = this._transitions.get(from);
        if (!allowed) return true;
        return allowed.has(to);
    }

    /** 广播状态变更 */
    private notifyListeners(from: string, to: string, data?: any): void {
        for (const cb of this._listeners) {
            cb(from, to, data);
        }
    }
}
