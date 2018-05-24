'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { PipelineExplorer, TerminalCache } from './PipelineExplorer';
import { openDevPod } from './OpenDevPod';
import { NotifyPromote } from './NotifyPromote';
import { KubeWatcher, KubeCrd } from './kube';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-jx-tools" is now active!');

    const pipelines = new KubeWatcher(KubeCrd.Pipelines);
    const terminals = new TerminalCache();

    // add the Tree viewer
    const subscriptions = new PipelineExplorer(pipelines, terminals).subscribe(context);
    
    subscriptions.push(vscode.commands.registerCommand('vsJenkinsX.openDevPod', resource => openDevPod(terminals)));
    subscriptions.push(new NotifyPromote(pipelines).subscribe());

    subscriptions.forEach((element) => {
        context.subscriptions.push(element);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}