// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class Test extends cc.Component {

    private _node1: cc.Node = null;
    private _node2: cc.Node = null;
    private _pfb1: cc.Prefab = null;
    private _pfb2: cc.Prefab = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        let a = new Map<number, { name: string, age?: number }>();
        a.set(1, { name: 'Alice', age: 20 });
        a.set(2, { name: 'Bob' });
        a.set(3, { name: 'Charlie', age: 40 });
        let val = a.get(2);
        console.log(val.name, val.age);
        // a.set(2, { name: 'David', age: 50 });
        val.name = 'Eve';
        val.age = 60;
        console.log(val.name, val.age);
        console.log(a.get(2).name, a.get(2).age);
    }

    dump() {
        console.log(cc.assetManager.assets);
    }

    // update (dt) {}
    load1() {
        cc.resources.load('prefabs/root1', cc.Prefab, (err: Error, res: cc.Prefab) => {
            if (err) {
                console.error(err);
                return;
            }

            if (!this._node1) {
                this._node1 = cc.instantiate(res);
                this._node1.x = -400;
                this.node.parent.addChild(this._node1);
            }
            res.addRef();
            if (res.refCount > 0) {
                this._pfb1 = res;
            }
        });
    }

    load2() {
        cc.resources.load('prefabs/root2', cc.Prefab, (err: Error, res: cc.Prefab) => {
            if (err) {
                console.error(err);
                return;
            }

            if (!this._node2) {
                this._node2 = cc.instantiate(res);
                this._node2.x = 400;
                this.node.parent.addChild(this._node2);
            }
            res.addRef();
            if (res.refCount > 0) {
                this._pfb2 = res;
            }
        });
    }

    dec1() {
        if (this._pfb1) {
            this._pfb1.decRef();
            if (this._pfb1.refCount <= 0) {
                this._pfb1 = null;
                this._node1.destroy();
                this._node1 = null;
            }
        }
    }

    dec2() {
        if (this._pfb2) {
            this._pfb2.decRef();
            if (this._pfb2.refCount <= 0) {
                this._pfb2 = null;
                this._node2.destroy();
                this._node2 = null;
            }
        }
    }

    release1() {
        if (this._pfb1) {
            cc.assetManager.releaseAsset(this._pfb1);
            this._pfb1 = null;
            this._node1.destroy();
            this._node1 = null;
        }
    }

    release2() {
        if (this._pfb2) {
            cc.assetManager.releaseAsset(this._pfb2);
            this._pfb2 = null;
            this._node2.destroy();
            this._node2 = null;
        }
    }

    remove1() {
        if (this._node1) {
            this._node1.getComponent("Root").enabled = false;
            this._node1.removeFromParent(true);
            this.scheduleOnce(() => {
                console.log('remove1');
                this._node1.destroy();
                this._node1 = null;
            }, 0.5);
        }
    }

    remove2() {
        if (this._node2) {
            this._node2.getComponent("Root").enabled = false;
            this._node2.removeFromParent(true);
            this.scheduleOnce(() => {
                console.log('remove2');
                this._node2.destroy();
                this._node2 = null;
            }, 0.5);
        }
    }

    releaseAll() {
        cc.assetManager.releaseAll();
    }
}
