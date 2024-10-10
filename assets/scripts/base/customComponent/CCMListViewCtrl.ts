/**
 * 异步列表控制器
 */

import CCMListViewItem from "./CCMListViewItem";

const UPDATE_INTERVAL = 0.1;     // 更新间隔

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

    @property(cc.Integer)
    paddingLeft: number = 0;            // item 左边距

    @property(cc.Integer)
    paddingRight: number = 0;           // item 右边距

    @property(cc.Integer)
    paddingTop: number = 0;             // item 上边距

    @property(cc.Integer)
    paddingBottom: number = 0;          // item 下边距

    @property(cc.Integer)
    colNum: number = 0;                 // item 列数

    @property(cc.Integer)
    rowNum: number = 0;                 // item 行数

    protected _dataList: any[] = [];                    // 数据数组
    protected _itemList: CCMListViewItem[] = [];        // 列表项数组
    protected _scrollViewContent: cc.Node = null;       // 滚动视图内容节点
    protected _updateElapsedTime: number = 0;           // 更新历时

    /**
     * 获取列表项位置
     * @param index 索引
     * @returns 
     */
    public getItemPosition(index: number) {
        return cc.v2(0, 0);
    }
}
