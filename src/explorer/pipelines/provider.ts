import * as vscode from 'vscode';
import { KubeWatcher } from '../../kube';
import { TerminalCache, executeInTerminal } from '../../term';
import {
    PipelineModel,
    PipelineTreeDataProvider,
    StageNode,
    BuildNode,
    RepoNode
} from './model';

export class PipelineExplorer {
    private pipelineModel = new PipelineModel();
    public treeProvider = new PipelineTreeDataProvider(this.pipelineModel);

    constructor(private pipelines: KubeWatcher, private terminals: TerminalCache) {}

    subscribe() {
        this.pipelineModel.connect(this.pipelines);

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
                        executeInTerminal(this.terminals, args, terminalName);
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
                executeInTerminal(this.terminals, args, terminalName);
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
                            executeInTerminal(this.terminals, args, terminalName);
                        }
                    }
                }
            }
        }
    }
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
