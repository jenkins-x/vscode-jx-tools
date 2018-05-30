import * as vscode from 'vscode';
import { TerminalCache } from '../term';

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

    const jxSyncTerminalName = "jx sync";
    let jxSyncTerminal = terminals.get(jxSyncTerminalName);
    if (!jxSyncTerminal) {
        const terminalOptions = {
            name: jxSyncTerminalName,
            cwd: path,
            shellPath: "jx",
            shellArgs: ["sync", "--watch-only"],
            env: process.env
        };
        jxSyncTerminal = terminals.getOrCreate(jxSyncTerminalName, terminalOptions);
        jxSyncTerminal.show(true);
    }

    const terminalOptions = {
        name: "DevPod: " + name,
        cwd: path,
        shellPath: "jx",
        shellArgs: ["create", "devpod", "--reuse", "--sync"],
        env: process.env
    };
    let terminal = vscode.window.createTerminal(terminalOptions);
    terminal.show();
}