
/*
*   网络相关接口定义
*   
*   2019-10-8 by 宝爷
*/

export type CCMNetData = (string | ArrayBufferLike | Blob | ArrayBufferView);
export type CCMNetCallFunc = (cmd: number, data: any) => void;

// 回调对象
export interface CCMCallbackObject {
    target: any,                // 回调对象，不为null时调用target.callback(xxx)
    callback: CCMNetCallFunc,      // 回调函数
}

// 请求对象
export interface CCMRequestObject {
    buffer: CCMNetData,             // 请求的Buffer
    rspCmd: number,                 // 等待响应指令(0表示不需要响应, 从1开始)
    rspObject: CCMCallbackObject,   // 等待响应的回调对象
}

// 协议辅助接口
export interface CCMIProtocolHelper {
    getHeadLen(): number;                   // 返回包头长度
    getHeartbeat(): CCMNetData;                 // 返回一个心跳包
    getPackageLen(msg: CCMNetData): number;    // 返回整个包的长度
    checkPackage(msg: CCMNetData): boolean;    // 检查包数据是否合法
    getPackageId(msg: CCMNetData): number;     // 返回包的id或协议类型
}

// 默认字符串协议对象
export class CCMDefStringProtocol implements CCMIProtocolHelper {
    getHeadLen(): number {
        return 0;
    }
    getHeartbeat(): CCMNetData {
        return "";
    }
    getPackageLen(msg: CCMNetData): number {
        return msg.toString().length;
    }
    checkPackage(msg: CCMNetData): boolean {
        return true;
    }
    getPackageId(msg: CCMNetData): number {
        return 0;
    }
}

// Socket接口
export interface CCMISocket {
    onConnected: (event: any) => void;           // 连接回调
    onMessage: (msg: CCMNetData) => void;      // 消息回调
    onError: (event: any) => void;               // 错误回调
    onClosed: (event: any) => void;              // 关闭回调

    connect(options: any): any;                  // 连接接口
    send(buffer: CCMNetData): any;                  // 数据发送接口
    close(code?: number, reason?: string): any;  // 关闭接口
}

// 网络提示接口
export interface CCMINetworkTips {
    connectTips(isShow: boolean): void;
    reconnectTips(isShow: boolean): void;
    requestTips(isShow: boolean): void;
}
