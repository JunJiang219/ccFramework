/**
 * 框架通用事件定义
 */

// 框架通用事件
export enum CCMEvent {
    TEST = "test",
    CANVAS_RESIZE = "canvas-resize",            // 画布尺寸变化，用于多分辨适配
    ORIENTATION_CHANGE = "orientationChange",
    RESOLUTION_CHANGE = "resolutionChange",
}