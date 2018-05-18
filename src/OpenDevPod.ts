import * as vscode from 'vscode';

export function openDevPod() {
    console.log("Opening DevPod");

    const workspaces = vscode.workspace.workspaceFolders;
    var path = "";
    var name = "";
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

    const terminalOptions = {
        name: "DevPod: " + name,
        cwd: path,
        shellPath: "jx",
        shellArgs: ["create", "devpod"],
        env: process.env
    };
    let terminal = vscode.window.createTerminal(terminalOptions);
    terminal.show();
}