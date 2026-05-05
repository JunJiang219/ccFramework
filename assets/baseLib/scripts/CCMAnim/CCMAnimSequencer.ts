/**
 * ============================================================
 * CCMAnimSequencer.ts — 动画编排器（baseLib 基础工具）
 * 职责：声明式编排串行/并行动画序列，消除回调地狱
 *       支持跳过（Turbo）、暂停、恢复
 * ============================================================
 */

import CCMSingleton from "../CCMBase/CCMSingleton";

export type CCMAnimStep = () => Promise<void>;

// ----------------------------------------------------------------
// CCMAnimSequence — 一段可编排的动画序列
// ----------------------------------------------------------------
export class CCMAnimSequence {
    private _steps: CCMAnimStep[] = [];
    private _skipped: boolean = false;
    private _paused: boolean = false;
    private _skipResolves: Array<() => void> = [];
    private _pausePromise: Promise<void> | null = null;
    private _pauseResolve: (() => void) | null = null;

    /** 追加一步（内部使用） */
    public _addStep(step: CCMAnimStep): this {
        this._steps.push(step);
        return this;
    }

    /** 播放整个序列，返回 Promise */
    public async play(): Promise<void> {
        this._skipped = false;
        for (const step of this._steps) {
            if (this._skipped) break;
            if (this._pausePromise) {
                await this._pausePromise;
            }
            await this._wrapSkippable(step);
        }
    }

    /** 跳过：立即结束所有等待中的 step */
    public skip(): void {
        this._skipped = true;
        for (const resolve of this._skipResolves) {
            resolve();
        }
        this._skipResolves.length = 0;
    }

    /** 暂停 */
    public pause(): void {
        if (this._paused) return;
        this._paused = true;
        this._pausePromise = new Promise(resolve => {
            this._pauseResolve = resolve;
        });
    }

    /** 恢复 */
    public resume(): void {
        if (!this._paused) return;
        this._paused = false;
        this._pauseResolve?.();
        this._pausePromise = null;
        this._pauseResolve = null;
    }

    public get isSkipped(): boolean { return this._skipped; }

    private _wrapSkippable(step: CCMAnimStep): Promise<void> {
        if (this._skipped) return Promise.resolve();
        const stepPromise = step();
        const skipPromise = new Promise<void>(resolve => {
            this._skipResolves.push(resolve);
        });
        return Promise.race([stepPromise, skipPromise]).then(() => {
            const idx = this._skipResolves.lastIndexOf(this._skipResolves[this._skipResolves.length - 1]);
            if (idx !== -1) this._skipResolves.splice(idx, 1);
        });
    }
}

// ----------------------------------------------------------------
// CCMAnimSequencer — 编排器入口
// ----------------------------------------------------------------
export class CCMAnimSequencer extends CCMSingleton {
    protected constructor() { super(); }

    /**
     * 串行：一步接一步执行
     * @example
     *   const seq = CCMAnimSequencer.getInstance().serial(stepA, stepB)
     *   await seq.play()
     */
    public serial(...steps: (CCMAnimStep | CCMAnimSequence)[]): CCMAnimSequence {
        const seq = new CCMAnimSequence();
        for (const step of steps) {
            if (step instanceof CCMAnimSequence) {
                seq._addStep(() => step.play());
            } else {
                seq._addStep(step);
            }
        }
        return seq;
    }

    /**
     * 并行：所有步骤同时开始，等全部完成
     * @example
     *   const seq = CCMAnimSequencer.getInstance().parallel(stepA, stepB)
     *   await seq.play()
     */
    public parallel(...steps: (CCMAnimStep | CCMAnimSequence)[]): CCMAnimSequence {
        const seq = new CCMAnimSequence();
        seq._addStep(async () => {
            const promises = steps.map(step =>
                step instanceof CCMAnimSequence ? step.play() : step()
            );
            await Promise.all(promises);
        });
        return seq;
    }

    /**
     * 延迟步骤
     * @param ms 延迟毫秒数
     */
    public delay(ms: number): CCMAnimStep {
        return () => new Promise<void>(resolve => setTimeout(resolve, ms));
    }

    /**
     * 条件步骤：满足条件才执行
     */
    public when(condition: () => boolean, step: CCMAnimStep | CCMAnimSequence): CCMAnimStep {
        return async () => {
            if (!condition()) return;
            if (step instanceof CCMAnimSequence) {
                await step.play();
            } else {
                await step();
            }
        };
    }

    /**
     * 回调包装：将普通回调包装为 CCMAnimStep
     */
    public wrap(fn: (resolve: () => void) => void): CCMAnimStep {
        return () => new Promise<void>(resolve => fn(resolve));
    }

    /**
     * 同步操作包装
     */
    public sync(fn: () => void): CCMAnimStep {
        return async () => fn();
    }

    /**
     * 将 Promise 工厂包装为 CCMAnimStep
     */
    public fromPromise(factory: () => Promise<any>): CCMAnimStep {
        return () => factory().then(() => {});
    }
}