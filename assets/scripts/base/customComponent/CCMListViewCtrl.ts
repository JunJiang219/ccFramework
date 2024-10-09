/**
 * 异步列表控制器
 */

import CCMListViewItem from "./CCMListViewItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMListViewCtrl extends cc.Component {

    @property(cc.Prefab)
    itemTemplate: cc.Prefab = null;     // 列表项预制件，挂载脚本继承自CCMListViewItem

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;   // 滚动视图

    @property(cc.Integer)
    spawnCount: number = 0;             // item 实例数量

    @property(cc.Integer)
    spacingX: number = 0;               // item 横向间距

    @property(cc.Integer)
    spacingY: number = 0;               // item 纵向间距
}
