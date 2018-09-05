import { TerminalCache, executeInTerminal } from '../term';

function createSpring(terminals: TerminalCache): void {
    const args = [ 'create', 'spring' ];
    executeInTerminal(terminals, args, 'Jenkins X');
}

export {
    createSpring
};