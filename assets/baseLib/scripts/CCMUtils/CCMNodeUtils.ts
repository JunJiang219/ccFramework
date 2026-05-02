import { Node, Widget } from "cc";

export class CCMNodeUtils {

    /**
     * 添加全屏Widget组件
     * @param node 待添加节点
     * @param target 对齐目标节点，默认为 Canvas
     * @returns 
     */
    public static addFullScreenWidget(node: Node, target?: Node) {
        if (node.getComponent(Widget)) return false;  // 已有组件

        let widget = node.addComponent(Widget);
        if (!widget) return false;    // 添加失败

        if (target) widget.target = target;
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
        widget.alignMode = Widget.AlignMode.ALWAYS;

        return true;
    }
}


