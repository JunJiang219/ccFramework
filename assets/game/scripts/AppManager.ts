import { _decorator, Component, Node, view } from 'cc';
import { CCMResManager } from 'db://assets/baseLib/scripts/CCMRes/CCMResManager';
import CCMLogger, { CCMLogLevel } from 'db://assets/baseLib/scripts/CCMLog/CCMLogger';
import { CCMUIManager } from 'db://assets/baseLib/scripts/CCMUI/CCMUIManager';
import { UIConfig, UIID } from './UIConfig';
import { DEBUG } from 'cc/env';
import CCMAdapter, { CCMDeviceOrientation } from 'db://assets/baseLib/scripts/CCMAdapter/CCMAdapter';
import { CCMEvent } from '../../baseLib/scripts/CCMEvent/CCMEventDefs';
const { ccclass, property } = _decorator;

@ccclass('AppManager')
export class AppManager extends Component {
    
    protected onLoad(): void {
        if (DEBUG) {
            window['uiMgr'] = CCMUIManager.getInstance();
        }

        // CCMLogger.getInstance().setLogLevel(CCMLogLevel.WARN);
        CCMLogger.getInstance().log("AppManager onLoad");

        this.initAdapter();
        CCMUIManager.getInstance().initUIConf(UIConfig);
        
        CCMUIManager.getInstance().open(UIID.TestUI);
    }

    protected initAdapter(): void {
        CCMAdapter.getInstance().deviceOrientation = CCMDeviceOrientation.LANDSCAPE;
        CCMAdapter.getInstance().resize();

        view.on(CCMEvent.CANVAS_RESIZE, this.onResize, this);
    }

    protected onResize(): void {
        CCMAdapter.getInstance().resize();
    }

    protected update(dt: number): void {
        CCMResManager.getInstance().update(dt);
    }

    protected onDestroy(): void {
        view.off(CCMEvent.CANVAS_RESIZE, this.onResize, this);
    }
}


