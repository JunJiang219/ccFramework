/**
 * 异步列表item
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class CCMListViewItem extends cc.Component {

    protected _index: number = 0;
    protected _data: any = null;

    /**
     * 更新item
     * @param index 数据列表索引
     * @param data 数据对象
     */
    public updateItem(index: number, data: any) {
        this._index = index;
        this._data = data;

        if (undefined == this._data || null == this._data) {
            this.node.active = false;
        } else {
            this.node.active = true;
        }
    }
}
