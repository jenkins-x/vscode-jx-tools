import * as path from 'path';
import * as vscode from 'vscode';
import { Terminal } from 'vscode';
import { TerminalCache } from './cache';

function executeInTerminal(terminals: TerminalCache, args: string[], terminalName: string, 
    preserveFocus?: boolean): Terminal {
    const terminal = terminals.getOrCreate(terminalName);
    const binary = getBinary()
     if (binary == '') {
        return terminal;
    }
    terminal.sendText(`${binary} ${args.join(' ')}`);
    if (preserveFocus) {
        terminal.show(preserveFocus);
    } else {
         terminal.show();
    }
    return terminal;
}

function getBinary(): string {
    let jxConfig  = vscode.workspace.getConfiguration("jx", 
        vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
    let jxPath = jxConfig['path'];
    var binary = 'jx';
    var exists = require('command-exists');
    if (jxPath !== null && jxPath != '') {
        binary = path.join(jxPath, binary);
        if (!exists.sync(binary)) {
            vscode.window.showErrorMessage('Failed to find the jx binary in your "jx.path" setting.');
            return "";
        }
    } else {
        if (!exists.sync(binary)) {
            vscode.window.showErrorMessage('Failed to find the jx binary in your PATH. You can specify its path in "jx.path" setting')
            return "";
        }
    }
    return binary
}

function executeInTerminalChained(terminals: TerminalCache, args: string[][], terminalName: 
    string, preserveFocus?: boolean): Terminal {
    const terminal = terminals.getOrCreate(terminalName);
    const binary = getBinary()
     if (binary == '') {
        return terminal;
    }
    var commands = '';
    for (let arg of args) {
        let command = `${binary} ${arg.join(' ')}`;
        if (commands != '') {
            commands = commands + ' && ' + command
        } else {
            commands = command
        }
    }
    terminal.sendText(commands)
    if (preserveFocus) {
        terminal.show(preserveFocus);
    } else {
        terminal.show()
    }
    return terminal;
}

export {
    executeInTerminal,
    executeInTerminalChained
};
