import * as vscode from 'vscode';
const k8s = require('@kubernetes/client-node');

export class Watch {

    constructor() {
    }

    subscribe(context: vscode.ExtensionContext) {

        let disposableActivity = vscode.commands.registerCommand('extension.watchActivity', () => {

            //let kc = k8s.Config.defaultClient();
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
            watch.watch('/apis/jenkins.io/v1/namespaces/jx/pipelineactivities',
                // optional query parameters can go here.
                // TODO filter on labels once we add them to Activities
                {},
                // callback is called for each received object.
                (type: any, obj: any) => {
                    if (type === 'ADDED') {
                        console.log('new object:');
                    } else if (type === 'MODIFIED') {
                        console.log('changed object:');
                    } else if (type === 'DELETED') {
                        console.log('deleted object:');
                        return;
                    } else {
                        console.log('unknown type: ' + type);
                        return;
                    }
                    let repoName = obj.metadata.name;
                    if (!obj.spec.steps) {
                        return;
                    }
                    console.log(obj);
    
                    if (!vscode.workspace.workspaceFolders) {
                        return;
                    }
    
                    // TODO lets remove this once we can use lables in the watch selector
                    // until then lets filer out activities we don't want here
                    let match = false;
                    for (let ws of vscode.workspace.workspaceFolders) {
                        if (repoName.indexOf(ws.name) >= 0) {
                            match = true;
                            break;
                        }
                    }
                    if (!match) {
                        return;
                    }
    
                    if (obj.spec.status === 'Succeeded' || obj.spec.status === 'Aborted') {
                        return;
                    }
                    for (let step of obj.spec.steps) {
                        switch (step.kind) {
                            case 'stage': {
                                if (step.stage) {
                                    if (step.stage.status === 'NotExecuted') {
                                        continue;
                                    }
                                    if (step.stage.status === 'Succeeded') {
                                        vscode.window.showInformationMessage(repoName + ': ' + step.stage.name);
                                        continue;
                                    }
                                    if (step.stage.status === 'Failed') {
                                        vscode.window.showWarningMessage(repoName + ': ' + step.stage.name);
                                        continue;
                                    }
                                }
                            }
                            case 'Promote': {
                                if (!step.promote) {
                                    continue;
                                }
                                if (step.promote.status === 'Succeeded') {
                                    vscode.window.showInformationMessage(repoName + ': promoted to ' + step.promote.environment + ". Access application [here](" + step.promote.applicationURL + ")");
                                    continue;
                                }
                                if (step.promote.status === 'Failed') {
                                    vscode.window.showWarningMessage(repoName + ': promoted to ' + step.promote.environment + ' failed');
                                    continue;
                                }
                            }
                            default: {
                            }
                        }
                    }
                },
                // done callback is called if the watch terminates normally
                (err: any) => {
                    if (err) {
                        console.log(err);
                    }
                });
            // // watch returns a request object which you can use to abort the watch.
            // setTimeout(() => { req.abort(); }, 100 * 10000);
        });
        return disposableActivity;
    }
}