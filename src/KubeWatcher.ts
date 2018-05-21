const k8s = require('@kubernetes/client-node');

export enum CallbackKind { ADD, UPDATE, DELETE }

export type WatchCallback = (kind: CallbackKind, event: any) => void;


export class KubeWatcher {
    private connected = false;
    private listeners: WatchCallback[] = [];
    private req: any;

    constructor() {
    }

    connect() {
        if (!this.connected) {
            this.connected = true;

            let kc = new k8s.KubeConfig();
            let configFile = process.env['HOME'] + '/.kube/config';
            try {
                kc.loadFromFile(configFile);
            } catch (e) {
                console.log('error reading ' + configFile + ': ' + e.message);
                throw e;
            }
            
            //let resourceVersion = 0
            let watch = new k8s.Watch(kc);

            // optional query parameters can go here.
            // TODO filter on labels once we add them to Activities
            const queryParameters = {};

            // callback is called for each received object.
            const callback = (type: any, obj: any) => {
                if (type === 'ADDED') {
                    this.notify(CallbackKind.ADD, obj);
                }
                else if (type === 'MODIFIED') {
                    this.notify(CallbackKind.UPDATE, obj);
                }
                else if (type === 'DELETED') {
                    this.notify(CallbackKind.DELETE, obj);
                }
                else {
                    throw new Error("unrecognised CallbackKind: " + type);
                }
            };

            // done callback is called if the watch terminates normally
            const errorHandler = (err: any) => {
                if (err) {
                    console.log(err);
                }
                console.log("Reconnecting watcher");

                this.req = watch.watch('/apis/jenkins.io/v1/namespaces/jx/pipelineactivities',
                    queryParameters,
                    callback,
                    errorHandler
                );
            };

            this.req = watch.watch('/apis/jenkins.io/v1/namespaces/jx/pipelineactivities',
                {},
                callback,
                errorHandler
            );
        }
    }

    disconnect() {
        if (!this.connected) {
            this.connected = false;
            this.req.abort();
        }
    }

    addCallback(cb: WatchCallback) {
        this.listeners.push(cb);
        this.connect();
    }

    removeCallback(cb: WatchCallback) {
        const index: number = this.listeners.indexOf(cb);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
        if (!this.listeners.length) {
            this.disconnect();
        }
    }

    notify(kind: CallbackKind, obj: Object) {
        this.listeners.forEach((it) => it(CallbackKind.ADD, obj));
    }
}