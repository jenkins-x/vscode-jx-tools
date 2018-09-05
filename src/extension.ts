'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, commands } from 'vscode';
import { KubeWatcher, KubeCrd } from './kube';
import { TerminalCache } from './term';
import { createCamel, createQuickstart, createSpring, openDevPod, notifyPromote } from './command';
import { createExplorerView } from './explorer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    console.log('Congratulations, your extension "vscode-jx-tools" is now active!');

    const pipelines = new KubeWatcher(KubeCrd.Pipelines);
    const terminals = new TerminalCache();

    const subscriptions = [
        ...createExplorerView(pipelines, terminals),
        commands.registerCommand('vsJenkinsX.openDevPod', _ => openDevPod(terminals)),
        commands.registerCommand('vsJenkinsX.createQuickstart', _ => createQuickstart(terminals)),
        commands.registerCommand('vsJenkinsX.createSpring', _ => createSpring(terminals)),
        commands.registerCommand('vsJenkinsX.createCamel', _ => createCamel(terminals)),
        commands.registerCommand('NotifyPromote.Activity', _ => notifyPromote(pipelines))
    ];

    subscriptions.forEach((element) => {
        context.subscriptions.push(element);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}