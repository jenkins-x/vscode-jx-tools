import * as vscode from 'vscode';
import { TerminalCache, executeInTerminal } from '../term';

export function openDevPod(terminals: TerminalCache) {
    console.log("Opening DevPod");

    const workspaces = vscode.workspace.workspaceFolders;
    let path = "";
    let name = "";
    if (workspaces) {
        for (let ws of workspaces) {
            let uri = ws.uri;
            name = ws.name;
            if (uri) {
                path = uri.fsPath;
                if (path) {
                    break;
                }
            }
        }
    }
    console.log(`found workspace folder ${path}`);

    const argsSync = ['sync'];
    executeInTerminal(terminals, argsSync, 'DevPod Sync: ' + name, true);

    let jxConfig  = vscode.workspace.getConfiguration("jx", 
        vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
    let ports = jxConfig['devPodPorts'].join(',');

    var  argsDevpod = ['create', 'devpod', '--reuse', '--sync'];
    if (ports !== null && ports !== '') {
        argsDevpod.push(`--ports=${ports}`);
    }
    executeInTerminal(terminals, argsDevpod, 'DevPod: ' + name);
}
