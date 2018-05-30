import * as k8s from '@kubernetes/client-node';
import config from '../config';

export type KubeWatchCallback = (kind: KubeCallbackKind, event: any) => void;

export enum KubeCallbackKind {
    ADD = 'ADDED',
    UPDATE = 'MODIFIED',
    DELETE = 'DELETED'
}

// only executed once - shared between different watchers
const kubeConfig = new k8s.KubeConfig();

try {
    kubeConfig.loadFromFile(config.kube.kubeFile);
} catch (e) {
    console.error(`error reading ${config.kube.kubeFile}: ${e.message}`);
    throw e;
}

export class KubeWatcher {
    private connected = false;
    private listeners: Array<KubeWatchCallback> = [];
    private request: any;

    constructor(private crd: string) {}

    connect() {
        if (!this.connected) {
            this.connected = true;
            const watcher = new k8s.Watch(kubeConfig);

            const callback = (phase: string, event: any) => {
                switch (phase) {
                    case KubeCallbackKind.ADD:    return this.notify(KubeCallbackKind.ADD, event);
                    case KubeCallbackKind.UPDATE: return this.notify(KubeCallbackKind.UPDATE, event);
                    case KubeCallbackKind.DELETE: return this.notify(KubeCallbackKind.DELETE, event);
                
                    default:
                        throw new Error(`unrecognised CallbackKind: ${phase}`);
                }
            };

            const execute = () => {
                this.request = watcher.watch(
                    config.kube.namespace + this.crd, {}, callback, errorHandler
                );
            };

            const errorHandler = (err: any) => {
                console.error(err);
                console.info('Reconnecting watcher');

                setTimeout(execute, 1000);
            };

            execute();
        }
    }

    disconnect() {
        if (!this.connected) {
            this.connected = false;
            this.request.abort();
        }
    }

    addCallback(callback: KubeWatchCallback) {
        this.listeners.push(callback);
        this.connect();
    }

    removeCallback(callback: KubeWatchCallback) {
        const index: number = this.listeners.indexOf(callback);

        if (index !== -1) {
            this.listeners.splice(index, 1);
        }

        if (!this.listeners.length) {
            this.disconnect();
        }
    }

    notify(kind: KubeCallbackKind, event: Object) {
        this.listeners.forEach((listener) => listener(kind, event));
    }
}