'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, commands } from 'vscode';
import { KubeWatcher, KubeCrd } from './kube';
import { createQuickstart } from './cmd';
import { TerminalCache } from './term';
import { PipelineExplorer } from './PipelineExplorer';
import { openDevPod } from './OpenDevPod';
import { NotifyPromote } from './NotifyPromote';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    console.log('Congratulations, your extension "vscode-jx-tools" is now active!');

    const pipelines = new KubeWatcher(KubeCrd.Pipelines);
    const terminals = new TerminalCache();

    // add the Tree viewer
    const subscriptions = new PipelineExplorer(pipelines, terminals).subscribe(context);
    
    subscriptions.push(commands.registerCommand('vsJenkinsX.openDevPod', _ => openDevPod(terminals)));
    subscriptions.push(commands.registerCommand('vsJenkinsX.createQuickstart', _ => createQuickstart(terminals)));
    subscriptions.push(new NotifyPromote(pipelines).subscribe());

    subscriptions.forEach((element) => {
        context.subscriptions.push(element);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}