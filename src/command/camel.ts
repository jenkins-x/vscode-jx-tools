import { TerminalCache, executeInTerminal } from '../term';

function createCamel(terminals: TerminalCache): void {
    const args = [ 'create', 'camel' ];
    executeInTerminal(terminals, args, 'Jenkins X');
}

export {
    createCamel
};