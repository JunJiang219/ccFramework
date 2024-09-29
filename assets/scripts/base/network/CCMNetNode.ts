import { ccmLog } from "../utils/CCMLog";
import { CCMISocket, CCMINetworkTips, CCMIProtocolHelper, CCMRequestObject, CCMCallbackObject, CCMNetData, CCMNetCallFunc } from "./CCMNetInterface";

/*
*   CocosCreator网络节点基类，以及网络相关接口定义
*   1. 网络连接、断开、请求发送、数据接收等基础功能
*   2. 心跳机制
*   3. 断线重连 + 请求重发
*   4. 调用网络屏蔽层
*
*   2018-5-7 by 宝爷
*/

type CCMExecuterFunc = (callback: CCMCallbackObject, buffer: CCMNetData) => void;
type CCMCheckFunc = (checkedFunc: CCMVoidFunc) => void;
type CCMVoidFunc = () => void;
type CCMBoolFunc = () => boolean;

export enum CCMNetTipsType {
    Connecting,
    ReConnecting,
    Requesting,
}

export enum CCMNetNodeState {
    Closed,                     // 已关闭
    Connecting,                 // 连接中
    Checking,                   // 验证中
    Working,                    // 可传输数据
}

export interface CCMNetConnectOptions {
    host?: string,              // 地址
    port?: number,              // 端口
    url?: string,               // url，与地址+端口二选一
    autoReconnect?: number,     // -1 永久重连，0不自动重连，其他正整数为自动重试次数
}

export class CCMNetNode {
    protected _connectOptions: CCMNetConnectOptions = null;
    protected _autoReconnect: number = 0;
    protected _isSocketInit: boolean = false;                               // Socket是否初始化过
    protected _isSocketOpen: boolean = false;                               // Socket是否连接成功过
    protected _state: CCMNetNodeState = CCMNetNodeState.Closed;                   // 节点当前状态
    protected _socket: CCMISocket = null;                                      // Socket对象（可能是原生socket、websocket、wx.socket...)

    protected _networkTips: CCMINetworkTips = null;                            // 网络提示ui对象（请求提示、断线重连提示等）
    protected _protocolHelper: CCMIProtocolHelper = null;                      // 包解析对象
    protected _connectedCallback: CCMCheckFunc = null;                         // 连接完成回调
    protected _disconnectCallback: CCMBoolFunc = null;                         // 断线回调
    protected _callbackExecuter: CCMExecuterFunc = null;                       // 回调执行

    protected _keepAliveTimer: any = null;                                  // 心跳定时器
    protected _receiveMsgTimer: any = null;                                 // 接收数据定时器
    protected _reconnectTimer: any = null;                                  // 重连定时器
    protected _heartTime: number = 10000;                                   // 心跳间隔(ms)
    protected _receiveTime: number = 6000000;                               // 多久没收到数据断开(ms)
    protected _reconnectTimeOut: number = 60000;                            // 重连间隔(ms)
    protected _requests: CCMRequestObject[] = Array<CCMRequestObject>();          // 请求列表
    protected _listener: { [key: number]: CCMCallbackObject[] } = {}           // 监听者列表

    /********************** 网络相关处理 *********************/
    public init(socket: CCMISocket, protocol: CCMIProtocolHelper, networkTips: any = null, execFunc: CCMExecuterFunc = null) {
        ccmLog.log(`CCMNetNode init socket`);
        this._socket = socket;
        this._protocolHelper = protocol;
        this._networkTips = networkTips;
        this._callbackExecuter = execFunc ? execFunc : (callback: CCMCallbackObject, buffer: CCMNetData) => {
            callback.callback.call(callback.target, 0, buffer);
        }
    }

    public connect(options: CCMNetConnectOptions): boolean {
        if (this._socket && this._state == CCMNetNodeState.Closed) {
            if (!this._isSocketInit) {
                this.initSocket();
            }
            this._state = CCMNetNodeState.Connecting;
            if (!this._socket.connect(options)) {
                this.updateNetTips(CCMNetTipsType.Connecting, false);
                return false;
            }

            if (this._connectOptions == null) {
                options.autoReconnect = options.autoReconnect;
            }
            this._connectOptions = options;
            this.updateNetTips(CCMNetTipsType.Connecting, true);
            return true;
        }
        return false;
    }

    protected initSocket() {
        this._socket.onConnected = (event) => { this.onConnected(event) };
        this._socket.onMessage = (msg) => { this.onMessage(msg) };
        this._socket.onError = (event) => { this.onError(event) };
        this._socket.onClosed = (event) => { this.onClosed(event) };
        this._isSocketInit = true;
    }

    protected updateNetTips(tipsType: CCMNetTipsType, isShow: boolean) {
        if (this._networkTips) {
            if (tipsType == CCMNetTipsType.Requesting) {
                this._networkTips.requestTips(isShow);
            } else if (tipsType == CCMNetTipsType.Connecting) {
                this._networkTips.connectTips(isShow);
            } else if (tipsType == CCMNetTipsType.ReConnecting) {
                this._networkTips.reconnectTips(isShow);
            }
        }
    }

    // 网络连接成功
    protected onConnected(event: any) {
        ccmLog.log("CCMNetNode onConnected!")
        this._isSocketOpen = true;
        // 如果设置了鉴权回调，在连接完成后进入鉴权阶段，等待鉴权结束
        if (this._connectedCallback !== null) {
            this._state = CCMNetNodeState.Checking;
            this._connectedCallback(() => { this.onChecked() });
        } else {
            this.onChecked();
        }
        ccmLog.log("CCMNetNode onConnected! state =" + this._state);
    }

    // 连接验证成功，进入工作状态
    protected onChecked() {
        ccmLog.log("CCMNetNode onChecked!")
        this._state = CCMNetNodeState.Working;
        // 关闭连接或重连中的状态显示
        this.updateNetTips(CCMNetTipsType.Connecting, false);
        this.updateNetTips(CCMNetTipsType.ReConnecting, false);

        // 重发待发送信息
        ccmLog.log(`CCMNetNode flush ${this._requests.length} request`)
        if (this._requests.length > 0) {
            for (var i = 0; i < this._requests.length;) {
                let req = this._requests[i];
                this._socket.send(req.buffer);
                if (req.rspObject == null || req.rspCmd <= 0) {
                    this._requests.splice(i, 1);
                } else {
                    ++i;
                }
            }
            // 如果还有等待返回的请求，启动网络请求层
            this.updateNetTips(CCMNetTipsType.Requesting, this.request.length > 0);
        }
    }

    // 接收到一个完整的消息包
    protected onMessage(msg: any): void {
        // ccmLog.log(`CCMNetNode onMessage status = ` + this._state);
        // 进行头部的校验（实际包长与头部长度是否匹配）
        if (!this._protocolHelper.checkPackage(msg)) {
            ccmLog.error(`CCMNetNode checkHead Error`);
            return;
        }
        // 接受到数据，重新定时收数据计时器
        this.resetReceiveMsgTimer();
        // 重置心跳包发送器
        this.resetHeartbeatTimer();
        // 触发消息执行
        let rspCmd = this._protocolHelper.getPackageId(msg);
        ccmLog.log(`CCMNetNode onMessage rspCmd = ` + rspCmd);
        // 优先触发request队列
        if (this._requests.length > 0) {
            for (let reqIdx in this._requests) {
                let req = this._requests[reqIdx];
                if (req.rspCmd == rspCmd) {
                    ccmLog.log(`CCMNetNode execute request rspcmd ${rspCmd}`);
                    this._callbackExecuter(req.rspObject, msg);
                    this._requests.splice(parseInt(reqIdx), 1);
                    break;
                }
            }
            ccmLog.log(`CCMNetNode still has ${this._requests.length} request waitting`);
            if (this._requests.length == 0) {
                this.updateNetTips(CCMNetTipsType.Requesting, false);
            }
        }

        let listeners = this._listener[rspCmd];
        if (null != listeners) {
            for (const rsp of listeners) {
                ccmLog.log(`CCMNetNode execute listener cmd ${rspCmd}`);
                this._callbackExecuter(rsp, msg);
            }
        }
    }

    protected onError(event: any) {
        ccmLog.error(event);
    }

    protected onClosed(event: any) {
        this.clearTimer();

        // 执行断线回调，返回false表示不进行重连
        if (this._disconnectCallback && !this._disconnectCallback()) {
            ccmLog.log(`disconnect return!`)
            return;
        }

        // 自动重连
        if (this.isAutoReconnect()) {
            this.updateNetTips(CCMNetTipsType.ReConnecting, true);
            this._reconnectTimer = setTimeout(() => {
                this._socket.close();
                this._state = CCMNetNodeState.Closed;
                this.connect(this._connectOptions);
                if (this._autoReconnect > 0) {
                    this._autoReconnect -= 1;
                }
            }, this._reconnectTimeOut);
        } else {
            this._state = CCMNetNodeState.Closed;
        }
    }

    public close(code?: number, reason?: string) {
        this.clearTimer();
        this._listener = {};
        this._requests.length = 0;
        if (this._networkTips) {
            this._networkTips.connectTips(false);
            this._networkTips.reconnectTips(false);
            this._networkTips.requestTips(false);
        }
        if (this._socket) {
            this._socket.close(code, reason);
        } else {
            this._state = CCMNetNodeState.Closed;
        }
    }

    // 只是关闭Socket套接字（仍然重用缓存与当前状态）
    public closeSocket(code?: number, reason?: string) {
        if (this._socket) {
            this._socket.close(code, reason);
        }
    }

    // 发起请求，如果当前处于重连中，进入缓存列表等待重连完成后发送
    public send(buf: CCMNetData, force: boolean = false): boolean {
        if (this._state == CCMNetNodeState.Working || force) {
            ccmLog.log(`socket send ...`);
            return this._socket.send(buf);
        } else if (this._state == CCMNetNodeState.Checking ||
            this._state == CCMNetNodeState.Connecting) {
            this._requests.push({
                buffer: buf,
                rspCmd: 0,
                rspObject: null
            });
            ccmLog.log("CCMNetNode socket is busy, push to send buffer, current state is " + this._state);
            return true;
        } else {
            ccmLog.error("CCMNetNode request error! current state is " + this._state);
            return false;
        }
    }

    // 发起请求，并进入缓存列表
    public request(buf: CCMNetData, rspCmd: number, rspObject: CCMCallbackObject, showTips: boolean = true, force: boolean = false) {
        if (this._state == CCMNetNodeState.Working || force) {
            this._socket.send(buf);
        }
        ccmLog.log(`CCMNetNode request with timeout for ${rspCmd}`);
        // 进入发送缓存列表
        this._requests.push({
            buffer: buf, rspCmd, rspObject
        });
        // 启动网络请求层
        if (showTips) {
            this.updateNetTips(CCMNetTipsType.Requesting, true);
        }
    }

    // 唯一request，确保没有同一响应的请求（避免一个请求重复发送，netTips界面的屏蔽也是一个好的方法）
    public requestUnique(buf: CCMNetData, rspCmd: number, rspObject: CCMCallbackObject, showTips: boolean = true, force: boolean = false): boolean {
        for (let i = 0; i < this._requests.length; ++i) {
            if (this._requests[i].rspCmd == rspCmd) {
                ccmLog.log(`CCMNetNode requestUnique failed for ${rspCmd}`);
                return false;
            }
        }
        this.request(buf, rspCmd, rspObject, showTips, force);
        return true;
    }

    /********************** 回调相关处理 *********************/
    public setResponseHandler(cmd: number, callback: CCMNetCallFunc, target?: any): boolean {
        if (callback == null) {
            ccmLog.error(`CCMNetNode setResponseHandler error ${cmd}`);
            return false;
        }
        this._listener[cmd] = [{ target, callback }];
        return true;
    }

    public addResponseHandler(cmd: number, callback: CCMNetCallFunc, target?: any): boolean {
        if (callback == null) {
            ccmLog.error(`CCMNetNode addResponseHandler error ${cmd}`);
            return false;
        }
        let rspObject = { target, callback };
        if (null == this._listener[cmd]) {
            this._listener[cmd] = [rspObject];
        } else {
            let index = this.getNetListenersIndex(cmd, rspObject);
            if (-1 == index) {
                this._listener[cmd].push(rspObject);
            }
        }
        return true;
    }

    public removeResponseHandler(cmd: number, callback: CCMNetCallFunc, target?: any) {
        if (null != this._listener[cmd] && callback != null) {
            let index = this.getNetListenersIndex(cmd, { target, callback });
            if (-1 != index) {
                this._listener[cmd].splice(index, 1);
            }
        }
    }

    public cleanListeners(cmd: number = -1) {
        if (cmd == -1) {
            this._listener = {}
        } else {
            this._listener[cmd] = null;
        }
    }

    protected getNetListenersIndex(cmd: number, rspObject: CCMCallbackObject): number {
        let index = -1;
        for (let i = 0; i < this._listener[cmd].length; i++) {
            let iterator = this._listener[cmd][i];
            if (iterator.callback == rspObject.callback
                && iterator.target == rspObject.target) {
                index = i;
                break;
            }
        }
        return index;
    }

    /********************** 心跳、超时相关处理 *********************/
    protected resetReceiveMsgTimer() {
        if (this._receiveMsgTimer !== null) {
            clearTimeout(this._receiveMsgTimer);
        }

        this._receiveMsgTimer = setTimeout(() => {
            ccmLog.warn("CCMNetNode receiveMsgTimer close socket!");
            this._socket.close();
        }, this._receiveTime);
    }

    protected resetHeartbeatTimer() {
        if (this._keepAliveTimer !== null) {
            clearTimeout(this._keepAliveTimer);
        }

        this._keepAliveTimer = setTimeout(() => {
            ccmLog.log("CCMNetNode keepAliveTimer send Heartbeat")
            this.send(this._protocolHelper.getHeartbeat());
        }, this._heartTime);
    }

    protected clearTimer() {
        if (this._receiveMsgTimer !== null) {
            clearTimeout(this._receiveMsgTimer);
        }
        if (this._keepAliveTimer !== null) {
            clearTimeout(this._keepAliveTimer);
        }
        if (this._reconnectTimer !== null) {
            clearTimeout(this._reconnectTimer);
        }
    }

    public isAutoReconnect() {
        return this._autoReconnect != 0;
    }

    public rejectReconnect() {
        this._autoReconnect = 0;
        this.clearTimer();
    }
}