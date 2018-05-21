import { TreeView } from 'vscode';
import * as vscode from 'vscode';

import { KubeWatcher } from './KubeWatcher';
import { PipelineModel, PipelineTreeDataProvider, ModelNode, StageNode, BuildNode, RepoNode } from './PipelineModel';

export class PipelineExplorer {
    private pipelineViewer: TreeView<ModelNode>;
    private pipelineModel = new PipelineModel();
    private treeProvider = new PipelineTreeDataProvider(this.pipelineModel);

    constructor(private terminals: TerminalCache, private kubeWatcher: KubeWatcher) {
        this.pipelineViewer = vscode.window.createTreeView('extension.vsJenkinsXExplorer', { treeDataProvider: this.treeProvider });
    }

    subscribe(context: vscode.ExtensionContext) {
        this.pipelineModel.connect(this.kubeWatcher);


        return [
            vscode.workspace.registerTextDocumentContentProvider('pipeline', this.treeProvider),
            vscode.window.registerTreeDataProvider('extension.vsJenkinsXExplorer', this.treeProvider),

            vscode.commands.registerCommand('PipelineExplorer.refresh', () => this.treeProvider.refresh()),
            vscode.commands.registerCommand('PipelineExplorer.openPipelineLogURL', resource => this.openPipelineLogURL(resource)),
            vscode.commands.registerCommand('PipelineExplorer.openRepositoryURL', resource => this.openRepositoryURL(resource)),
            vscode.commands.registerCommand('PipelineExplorer.openPipelineResource', resource => this.openResource(resource)),
            vscode.commands.registerCommand('PipelineExplorer.watchBuildLog', resource => this.watchBuildLog(resource)),
            vscode.commands.registerCommand('PipelineExplorer.startPipeline', resource => this.startPipeline(resource)),
            vscode.commands.registerCommand('PipelineExplorer.stopPipeline', resource => this.stopPipeline(resource)),
            vscode.commands.registerCommand('PipelineExplorer.revealResource', () => this.reveal()),
            vscode.commands.registerCommand('PipelineExplorer.openEnvironmentApplication', resource => this.openStageNodeUrl(resource)),
            vscode.commands.registerCommand('PipelineExplorer.openPreviewApplication', resource => this.openStageNodeUrl(resource)),
            vscode.commands.registerCommand('PipelineExplorer.openPullRequest', resource => this.openStageNodeUrl(resource)),
            vscode.commands.registerCommand('PipelineExplorer.openUpdate', resource => this.openStageNodeUrl(resource)),
        ];
    }
    //    private openResource(resource?: vscode.Uri): void {

    private openStageNodeUrl(resource?: StageNode): void {
        if (resource) {
            openUrl(resource.url);
        }
    }

    private openPipelineLogURL(resource?: BuildNode): void {
        if (resource) {
            let pipeline = resource.pipeline;
            if (pipeline) {
                let spec = pipeline.spec;
                if (spec) {
                    openUrl(spec.buildLogsUrl);
                }
            }
        }
    }

    private openRepositoryURL(resource?: BuildNode): void {
        if (resource) {
            let pipeline = resource.pipeline;
            if (pipeline) {
                let spec = pipeline.spec;
                if (spec) {
                    openUrl(spec.gitUrl);
                }
            }
        }
    }

    private openResource(resource?: BuildNode): void {
        if (resource) {
            let pipeline = resource.pipeline;
            if (pipeline) {
                let spec = pipeline.spec;
                if (spec) {
                    openUrl(spec.buildUrl);
                }
            }
        }
    }

    private watchBuildLog(resource?: BuildNode): void {
        if (resource) {
            let pipeline = resource.pipeline;
            if (pipeline) {
                let spec = pipeline.spec;
                if (spec) {
                    let pipelineName = spec.pipeline;
                    if (pipelineName) {
                        let buildNumber = spec.build || "";
                        let terminalName = "Jenkins Log: " + pipelineName + " #" + buildNumber;
                        let args = ["get", "build", "log", pipelineName];
                        if (buildNumber) {
                            args.push("--build", buildNumber);
                        }
                        runJXAsTerminal(this.terminals, args, terminalName);
                    }
                }
            }
        }
    }

    private startPipeline(resource?: RepoNode | BuildNode): void {
        if (resource) {
            let pipelineName = resource.pipelineName;
            if (pipelineName) {
                let terminalName = "Jenkins X";
                let args = ["start", "pipeline", pipelineName];
                runJXAsTerminal(this.terminals, args, terminalName);
            }
        }
    }

    private stopPipeline(resource?: BuildNode): void {
        if (resource) {
            let pipeline = resource.pipeline;
            if (pipeline) {
                let spec = pipeline.spec;
                if (spec) {
                    let pipelineName = spec.pipeline;
                    if (pipelineName) {
                        let buildNumber = spec.build || "";
                        if (buildNumber) {
                            let terminalName = "Jenkins X";
                            let args = ["stop", "pipeline", pipelineName, "--build", buildNumber];
                            runJXAsTerminal(this.terminals, args, terminalName);
                        }
                    }
                }
            }
        }
    }

    private reveal(): void {
        const node = this.getNode();
        if (node) {
            this.pipelineViewer.reveal(node);
        }
    }

    private getNode(): ModelNode | null {
        if (vscode.window.activeTextEditor) {
            const uri = vscode.window.activeTextEditor.document.uri;
            if (uri.scheme === 'pipeline') {
                return nodeForUri(uri, this.pipelineModel);
            }
        }
        return null;
    }
}



export class TerminalCache {
    private terminals = new Map<string, vscode.Terminal>();

    constructor() {
        vscode.window.onDidCloseTerminal(terminal => {
            const name = terminal.name;
            let other = this.terminals.get(name);
            if (other) {
                console.log(`Detected closing terminal ${name}`);
                this.terminals.delete(name);
            }
        });
    }

    /** 
     * Returns the terminal of the given name
     */
    get(terminalName: string): vscode.Terminal | undefined {
        return this.terminals.get(terminalName);
    }

    /** 
     * Lazily creates a new terminal if one does not already exist
     */
    getOrCreate(terminalName: string, options?: vscode.TerminalOptions): vscode.Terminal {
        let terminal = this.terminals.get(terminalName);
        if (!terminal) {
            const terminalOptions = options || {
                name: terminalName,
                env: process.env
            };
            terminal = vscode.window.createTerminal(terminalOptions);
            this.terminals.set(terminalName, terminal);
        }
        return terminal;
    }
}


function runJXAsTerminal(terminals: TerminalCache, args: string[], terminalName: string): vscode.Terminal {
    // TODO validate jx is on the $PATH and if not install it
    let terminal = terminals.getOrCreate(terminalName);
    terminal.sendText("jx " + args.join(" "));
    terminal.show();
    return terminal;
}


function openUrl(u?: string): void {
    if (u) {
        // lets try preserve the actual URI path
        // as the parse method breaks blue ocean paths using %2F
        let uri = vscode.Uri.parse(u);
        const host = uri.authority;
        if (host) {
            const idx = u.indexOf(host);
            if (idx > 0) {
                const path = u.substring(idx + host.length);
                console.log(`Found path: ${path} when URI has path ${uri.path}`);
                uri = uri.with({path: path});
            }
        }
        vscode.commands.executeCommand('vscode.open', uri);
    }
}

/*
 * Returns the node for the given URI
 */
function nodeForUri(uri: vscode.Uri, node: ModelNode): ModelNode | null {
    if (!node) {
        return null;
    }
    if (node.resource === uri) {
        return node;
    }
    for (let child of node.getChildren()) {
        let answer = nodeForUri(uri, child);
        if (answer) {
            return answer;
        }
    }
    return null;
}



    /*
    if (await checkPresent(context, 'command')) {
        const term = context.host.createTerminal(terminalName, path(context), command);
        term.show();
    }
    */

/*
type CheckPresentMessageMode = 'command' | 'activation' | 'silent';


interface Context {
    readonly host: Host;
    readonly fs: FS;
    readonly shell: Shell;
    readonly installDependenciesCallback: () => void;
    binFound: boolean;
    binPath: string;
}

async function checkPresent(context: Context, errorMessageMode: CheckPresentMessageMode): Promise<boolean> {
    if (context.binFound) {
        return true;
    }

    return await checkForJXInternal(context, errorMessageMode);
}

async function checkForJXInternal(context: Context, errorMessageMode: CheckPresentMessageMode): Promise<boolean> {
    const binName = 'jx';
    const bin = context.host.getConfiguration('vs-kubernetes')[`vs-jx.${binName}-path`];

    const contextMessage = getCheckKubectlContextMessage(errorMessageMode);
    const inferFailedMessage = 'Could not find "jx" binary.' + contextMessage;
    const configuredFileMissingMessage = bin + ' does not exist!' + contextMessage;

    return await binutil.checkForBinary(context, bin, binName, inferFailedMessage, configuredFileMissingMessage, errorMessageMode !== 'silent');
}
*/

