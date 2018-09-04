import { Terminal } from 'vscode';
import { TerminalCache } from './cache';

function executeInTerminal(terminals: TerminalCache, args: string[], terminalName: string, preserveFocus?: boolean): Terminal {
    // TODO validate jx is on the $PATH and if not install it
    const terminal = terminals.getOrCreate(terminalName);

    terminal.sendText(`jx ${args.join(' ')}`);
    if (preserveFocus)
        terminal.show(preserveFocus);
    else 
        terminal.show()

    return terminal;
}

export {
    executeInTerminal
};
