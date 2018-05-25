import { Terminal } from 'vscode';
import { TerminalCache } from './cache';

function executeInTerminal(terminals: TerminalCache, args: string[], terminalName: string): Terminal {
    // TODO validate jx is on the $PATH and if not install it
    const terminal = terminals.getOrCreate(terminalName);

    terminal.sendText(`jx ${args.join(' ')}`);
    terminal.show();

    return terminal;
}

export {
    executeInTerminal
};