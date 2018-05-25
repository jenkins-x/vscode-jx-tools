import { TerminalCache, executeInTerminal } from '../term';

function createQuickstart(terminals: TerminalCache): void {
    const args = [ 'create', 'quickstart' ];
    executeInTerminal(terminals, args, 'Jenkins X');
}

export {
    createQuickstart
};