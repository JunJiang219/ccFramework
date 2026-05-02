import { _decorator, assetManager, Component, director, instantiate, Node, Prefab, resources } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('App')
export class App extends Component {
    
    protected onLoad(): void {
        assetManager.loadBundle("baseLib", (err, bundle) => {
            if (err) {
                console.error(err);
                return;
            }

            assetManager.loadBundle("game", (err, bundle) => {
                if (err) {
                    console.error(err);
                    return;
                }

                bundle.load("prefabs/AppManager", Prefab, (err: Error, prefab: Prefab) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    const node = instantiate(prefab);
                    director.addPersistRootNode(node);
                });
            });
        });
    }
}


