import { Terminal, TerminalOptions, window } from 'vscode';

class TerminalCache {
    private terminals = new Map<string, Terminal>();

    constructor() {
        window.onDidCloseTerminal(terminal => {
            const name = terminal.name;
            const other = this.terminals.get(name);

            if (other) {
                console.info(`Detected closing terminal ${name}`);
                this.terminals.delete(name);
            }
        });
    }

    /** 
     * Returns the terminal of the given name
     */
    get(terminalName: string): Terminal | undefined {
        return this.terminals.get(terminalName);
    }

    /** 
     * Lazily creates a new terminal if one does not already exist
     */
    getOrCreate(terminalName: string, options?: TerminalOptions): Terminal {
        let terminal = this.terminals.get(terminalName);

        if (!terminal) {
            const terminalOptions = options || {
                name: terminalName,
                env: process.env
            };

            terminal = window.createTerminal(terminalOptions);
            this.terminals.set(terminalName, terminal);
        }

        return terminal;
    }
}

export {
    TerminalCache
};