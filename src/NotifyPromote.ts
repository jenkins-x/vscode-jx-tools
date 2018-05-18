import * as vscode from 'vscode';
import { KubeWatcher, CallbackKind } from './KubeWatcher';

const k8s = require('@kubernetes/client-node');

export class NotifyPromote {


    constructor() {
    }

    subscribe() {
        return vscode.commands.registerCommand('NotifyPromote.Activity', () => this.promoteCallback())
    }

    promoteCallback() {
        let kw = new KubeWatcher();
        kw.addCallback((kind: CallbackKind, obj: any): void => {
            let repoName = obj.metadata.name;
            if (!obj.spec.steps) {
                return;
            }

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
                            if (step.stage.status === 'Failed') {
                                vscode.window.showWarningMessage('FAILED ' + repoName + ': ' + step.stage.name);
                                continue;
                            }
                            if (step.stage.status === 'Aborted') {
                                vscode.window.showWarningMessage('ABORTED ' + repoName + ': ' + step.stage.name + ' aborted');
                                continue;
                            }
                        }
                    }

                    case 'Promote': {
                        if (!step.promote) {
                            continue;
                        }
                        if (step.promote.status === 'Succeeded') {
                            vscode.window.showInformationMessage('SUCCESS ' + repoName + ': promoted to ' + step.promote.environment + ". Access application [here](" + step.promote.applicationURL + ")");
                            continue;
                        }
                        if (step.promote.status === 'Failed') {
                            vscode.window.showWarningMessage('FAILED ' + repoName + ': promoted to ' + step.promote.environment);
                            continue;
                        }
                        if (step.promote.status === 'Aborted') {
                            vscode.window.showWarningMessage('ABORTED ' + repoName + ': promoted to ' + step.promote.environment);
                            continue;
                        }
                    }
                    default: {
                    }
                }
            }
        });
    }
}