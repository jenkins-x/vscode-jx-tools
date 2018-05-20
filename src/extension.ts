'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { PipelineExplorer, TerminalCache } from './PipelineExplorer';
import { openDevPod } from './OpenDevPod';
import { NotifyPromote } from './NotifyPromote';
import { KubeWatcher } from './KubeWatcher';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-jx-tools" is now active!');

    const kubeWatcher = new KubeWatcher();
    const terminals = new TerminalCache();

    // add the Tree viewer
    let subscriptions = new PipelineExplorer(terminals, kubeWatcher).subscribe(context);
    
    subscriptions.push(vscode.commands.registerCommand('vsJenkinsX.openDevPod', resource => openDevPod(terminals)));
    subscriptions.push(new NotifyPromote(kubeWatcher).subscribe());

    subscriptions.forEach((element) => {
        context.subscriptions.push(element);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}