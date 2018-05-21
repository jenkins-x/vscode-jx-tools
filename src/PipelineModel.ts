import * as vscode from 'vscode';
import * as path from 'path';
import * as moment from 'moment';

import { EventEmitter, TreeItem, Event, TreeItemCollapsibleState, Uri, TextDocumentContentProvider, CancellationToken, ProviderResult, TreeDataProvider } from 'vscode';
import { KubeWatcher, CallbackKind } from './KubeWatcher';

export interface ModelNode {
    readonly resource: vscode.Uri;
    readonly isDirectory: boolean;
    readonly label: string;
    readonly title: string;
    readonly contextValue: string;
    readonly tooltip: string;
    readonly iconPath: string;
    readonly commandName: string;

    getChildren(): ModelNode[];

    parent(): ModelNode;
}

export class StageNode implements ModelNode {
    constructor(public resource: vscode.Uri, public build: BuildNode, public name: string, readonly pipeline: any, readonly step: any, readonly contextValue: string, readonly url?: string) {
    }

    getChildren(): ModelNode[] {
        return [];
    }

    parent(): ModelNode {
        return this.build;
    }

    get isDirectory(): boolean {
        return false;
    }

    get title(): string {
        return "Stage";
    }

    get label(): string {
        return this.name;
    }

    get commandName(): string {
        /*
        // TODO wonder if we could only enable these commands if folks double click on the node rather than on selection?

        switch (this.contextValue) {
            case "vsJenkinsX.pipelines.stage.app":
                return "PipelineExplorer.openEnvironmentApplication";
            case "vsJenkinsX.pipelines.stage.pullRequest":
                return "PipelineExplorer.openPullRequest";
            case "vsJenkinsX.pipelines.stage.update":
                return "PipelineExplorer.openUpdate";
        }
        */
        return "";
    }

    get iconPath(): string {
        switch (this.status) {
            case "Succeeded":
                return "images/atomist_build_passed.png";
            case "Failed":
            case "Error":
                return "images/atomist_build_failed.png";
            case "Running":
                return "images/spinner.gif";
            case "Aborted":
                return "images/circle-64.png";
            case "NotExecuted":
                // TODO
                return "";
        }
        return "";
    }

    get tooltip(): string {
        let step = this.step || {};
        return this.name + ": " + this.status + elapsedTime(" Duration: ", step.startedTimestamp, step.completedTimestamp);
    }

    get status(): string {
        let step = this.step || {};
        return step.status || "Unknown";
    }

}


export class BuildNode implements ModelNode {
    private _pipeline: any = null;
    private _children: StageNode[] = [];

    constructor(public resource: vscode.Uri, public branch: BranchNode, public buildNumber: string) {
    }

    getChildren(): ModelNode[] {
        let answer: ModelNode[] = [];
        this._children.forEach(value => answer.push(value));
        return answer;
    }

    parent(): ModelNode {
        return this.branch;
    }

    get isDirectory(): boolean {
        return true;
    }

    get title(): string {
        return "Build";
    }

    get label(): string {
        return this.buildNumber;
    }

    get commandName(): string {
        return "";
    }

    get iconPath(): string {
        switch (this.status) {
            case "Succeeded":
                return "images/atomist_build_passed.png";
            case "Failed":
            case "Error":
                return "images/atomist_build_failed.png";
            case "Running":
                return "images/spinner.gif";
            case "Aborted":
                return "images/circle-64.png";
        }
        return "";
    }

    get tooltip(): string {
        let step = this.pipelineSpec;
        return "#" + this.buildNumber + ": " + this.status + elapsedTime(" Duration: ", step.startedTimestamp, step.completedTimestamp);
    }

    get pipeline(): any {
        return this._pipeline;
    }

    set pipeline(that: any) {
        this._pipeline = that;

        // lets create the children 
        this._children = [];

        let spec = this.pipelineSpec;
        let steps = spec.steps;
        if (steps) {
            for (const step of steps) {
                if (step) {
                    var subStep = step;
                    let stage = step.stage;
                    let preview = step.preview;
                    let promote = step.promote;
                    var name = "";
                    if (stage) {
                        subStep = stage;
                        name = stage.name;
                        this._children.push(new StageNode(addChildUrl(this.resource, name), this, name, this.pipeline, subStep, "vsJenkinsX.pipelines.stage", ""));
                    }
                    if (preview) {
                        let prUrl = preview.pullRequestURL;
                        let appUrl = preview.applicationURL;
                        if (prUrl) {
                            this._children.push(new StageNode(addChildUrl(this.resource, name), this, "Pull Request", this.pipeline, preview, "vsJenkinsX.pipelines.stage.pullRequest", prUrl));
                        }
                        if (appUrl) {
                            this._children.push(new StageNode(addChildUrl(this.resource, name), this, "Preview Application", this.pipeline, preview, "vsJenkinsX.pipelines.stage.preview", appUrl));
                        } else {
                            this._children.push(new StageNode(addChildUrl(this.resource, name), this, "Preview Application building", this.pipeline, preview, "vsJenkinsX.pipelines.stage.stage", ""));
                        }
                    } else if (promote) {
                        subStep = promote;
                        let envName: string = stringCapitalise(promote.environment);
                        name = "Promote to " + envName + "";

                        let appUrl = promote.applicationURL;
                        const stageContextValue = appUrl ? "vsJenkinsX.pipelines.stage.app" : "vsJenkinsX.pipelines.stage";
                        this._children.push(new StageNode(addChildUrl(this.resource, name), this, name, this.pipeline, subStep, stageContextValue, appUrl));
                        let pullRequest = subStep.pullRequest;
                        if (pullRequest) {
                            var pullRequestName = name + " Pull Request";
                            let prUrl: string = pullRequest.pullRequestURL || "";
                            if (prUrl) {
                                let idx = prUrl.lastIndexOf("/");
                                if (idx > 0) {
                                    pullRequestName += " #" + prUrl.substring(idx + 1);
                                }
                            }
                            this._children.push(new StageNode(addChildUrl(this.resource, name), this, pullRequestName, this.pipeline, pullRequest, "vsJenkinsX.pipelines.stage.pullRequest", prUrl));
                        }
                        let update = subStep.update;
                        if (update) {
                            var updatetName = name + " Update";
                            let statuses = update.statuses;
                            var updateUrl = "";
                            for (const status of statuses) {
                                updateUrl = status.url;
                                if (updateUrl) {
                                    break;
                                }
                            }
                            this._children.push(new StageNode(addChildUrl(this.resource, name), this, updatetName, this.pipeline, pullRequest, "vsJenkinsX.pipelines.stage.update", updateUrl));
                        }
                        if (appUrl) {
                            let appName = "App promoted to " + envName;
                            this._children.push(new StageNode(addChildUrl(this.resource, name), this, appName, this.pipeline, promote, "vsJenkinsX.pipelines.stage.app", appUrl));
                        }
                    }
                }
            }
        }
    }


    get status(): string {
        let status = "";
        let pipeline = this.pipeline;
        if (pipeline) {
            let spec = pipeline.spec;
            if (spec) {
                status = spec.status;
            }
        }
        status = status || "Unknown";
        return status;
    }

    get pipelineSpec(): any {
        let pipeline = this.pipeline;
        if (pipeline) {
            return pipeline.spec || {};
        }
        return {};
    }

    get buildLogsUrl(): string {
        return this.pipelineSpec.buildLogsUrl || "";
    }

    get buildUrl(): string {
        return this.pipelineSpec.buildUrl || "";
    }

    get gitUrl(): string {
        return this.pipelineSpec.gitUrl || "";
    }

    get pipelineName(): string {
        return this.pipelineSpec.pipeline || "";
    }

    get contextValue(): string {
        let suffix = this.status === "Running" ? ".Running" : "";
        if (this.buildLogsUrl && this.buildUrl && this.gitUrl) {
            return "vsJenkinsX.pipelines.build.hasUrls" + suffix;
        }
        return "vsJenkinsX.pipelines.build" + suffix;
    }
}

export class BranchNode implements ModelNode {
    private nodes: Map<string, BuildNode> = new Map<string, BuildNode>();

    constructor(public resource: vscode.Uri, public repo: RepoNode, public parentNode: ModelNode, public branchName: string) {
    }

    isEmpty(): boolean {
        return this.nodes.size === 0;
    }

    get isDirectory(): boolean {
        return true;
    }

    get title(): string {
        return "Branch";
    }

    get label(): string {
        return this.branchName;
    }

    get tooltip(): string {
        return this.repo.tooltip + " branch: " + this.branchName;
    }

    get commandName(): string {
        return "";
    }

    get iconPath(): string {
        return "images/github.png";
    }

    get contextValue(): string {
        return "vsJenkinsX.pipelines.branch";
    }

    get pipelineName(): string {
        return this.repo.owner.folder + "/" + this.repo.repoName + "/" + this.branchName;
    }

    getChildren(): ModelNode[] {
        let answer: BuildNode[] = [];
        this.nodes.forEach((value: BuildNode, key: string) => {
            answer.push(value);
        });
        answer.sort((n1, n2) => {
            if (n1.buildNumber && !n2.buildNumber) {
                return 1;
            }

            if (!n1.buildNumber && n2.buildNumber) {
                return -1;
            }
            return +n2.buildNumber - (+n1.buildNumber);
        });
        return answer;
    }

    parent(): ModelNode {
        return this.parentNode;
    }


    upsertPipeline(buildNumber: string, pipeline: any) {
        if (buildNumber) {
            let build = this.nodes.get(buildNumber);
            if (!build) {
                build = new BuildNode(addChildUrl(this.resource, buildNumber), this, buildNumber);
                this.nodes.set(buildNumber, build);
            }
            build.pipeline = pipeline;
        }
    }

    deletePipeline(buildNumber: string, pipeline: any) {
        if (buildNumber) {
            this.nodes.delete(buildNumber);
        }
    }

}

export class PullRequestsNode implements ModelNode {
    private nodes: Map<string, BranchNode> = new Map<string, BranchNode>();

    constructor(public resource: vscode.Uri, public repo: RepoNode) {
    }

    isEmpty(): boolean {
        return this.nodes.size === 0;
    }

    get isDirectory(): boolean {
        return true;
    }

    get title(): string {
        return "Pull Requests";
    }

    get label(): string {
        return "pull requests";
    }

    get tooltip(): string {
        return "Pull Requests on Repository " + this.repo.owner.folder + "/" + this.repo.repoName;
    }

    get commandName(): string {
        return "";
    }

    get iconPath(): string {
        return "images/github.png";
    }

    get contextValue(): string {
        return "vsJenkinsX.pipelines.pullRequests";
    }

    parent(): ModelNode {
        return this.repo;
    }

    getChildren(): ModelNode[] {
        let answer: BranchNode[] = [];
        this.nodes.forEach((value: BranchNode, key: string) => {
            answer.push(value);
        });
        /*
        answer.sort((n1, n2) => {
            if (n1.buildNumber && !n2.buildNumber) {
                return 1;
            }

            if (!n1.buildNumber && n2.buildNumber) {
                return -1;
            }
            return +n2.buildNumber - (+n1.buildNumber);
        });
        */
        answer.sort();
        return answer;
    }


    upsertPipeline(branchName: string, buildNumber: string, pipeline: any) {
        if (branchName) {
            let branch = this.nodes.get(branchName);
            if (!branch) {
                branch = new BranchNode(addChildUrl(this.resource, branchName), this.repo, this, branchName);
                this.nodes.set(branchName, branch);
            }
            branch.upsertPipeline(buildNumber, pipeline);
        }
    }

    deletePipeline(branchName: string, buildNumber: string, pipeline: any) {
        if (branchName) {
            let branch = this.nodes.get(branchName);
            if (branch) {
                branch.deletePipeline(buildNumber, pipeline);
                if (branch.isEmpty) {
                    this.nodes.delete(branchName);
                }
            }
        }
    }
}

export class RepoNode implements ModelNode {
    private nodes: Map<string, BranchNode> = new Map<string, BranchNode>();
    private pullRequests: PullRequestsNode;

    constructor(public resource: vscode.Uri, public owner: OwnerNode, public repoName: string) {
        this.pullRequests = new PullRequestsNode(addChildUrl(this.resource, "pullRequests"), this);
    }

    isEmpty(): boolean {
        return this.nodes.size === 0;
    }

    get isDirectory(): boolean {
        return true;
    }

    get title(): string {
        return "Repository";
    }

    get label(): string {
        return this.repoName;
    }

    get tooltip(): string {
        return "Git Repository " + this.owner.folder + "/" + this.repoName;
    }

    get commandName(): string {
        return "";
    }

    get iconPath(): string {
        return "images/github.png";
    }

    get contextValue(): string {
        return "vsJenkinsX.pipelines.repo";
    }

    get pipelineName(): string {
        return this.owner.folder + "/" + this.repoName + "/master";
    }

    parent(): ModelNode {
        return this.owner;
    }

    getChildren(): ModelNode[] {
        let answer: ModelNode[] = [];
        this.nodes.forEach((value: BranchNode, key: string) => {
            answer.push(value);
        });
        /*
        answer.sort((n1, n2) => {
            if (n1.buildNumber && !n2.buildNumber) {
                return 1;
            }

            if (!n1.buildNumber && n2.buildNumber) {
                return -1;
            }
            return +n2.buildNumber - (+n1.buildNumber);
        });
        */
        answer.sort();
        if (!this.pullRequests.isEmpty()) {
            answer.push(this.pullRequests);
        }
        return answer;
    }

    upsertPipeline(branchName: string, buildNumber: string, pipeline: any) {
        if (branchName) {
            if (isPullRequestBranch(branchName)) {
                this.pullRequests.upsertPipeline(branchName, buildNumber, pipeline);
            } else {
            let branch = this.nodes.get(branchName);
            if (!branch) {
                branch = new BranchNode(addChildUrl(this.resource, branchName), this, this, branchName);
                this.nodes.set(branchName, branch);
            }
            branch.upsertPipeline(buildNumber, pipeline);
        }
        }
    }

    deletePipeline(branchName: string, buildNumber: string, pipeline: any) {
        if (branchName) {
            if (isPullRequestBranch(branchName)) {
                this.pullRequests.deletePipeline(branchName, buildNumber, pipeline);
            } else {
            let branch = this.nodes.get(branchName);
            if (branch) {
                branch.deletePipeline(buildNumber, pipeline);
                if (branch.isEmpty) {
                    this.nodes.delete(branchName);
                }
            }
        }
        }
    }
}

/**
 * Returns whether or not the given branch name is a Pull Request or not
 * 
 * @param branchName the name of the branch
 */
function isPullRequestBranch(branchName: string): boolean {
    return branchName.toUpperCase().startsWith("PR-");
}

/** Returns a relative URI */
function addChildUrl(uri: vscode.Uri, path: string): vscode.Uri {
    return uri.with({ path: uri.path + "/" + path });
}

export class OwnerNode implements ModelNode {
    private nodes: Map<string, RepoNode> = new Map<string, RepoNode>();

    constructor(public resource: vscode.Uri, public model: PipelineModel, public folder: string) {
    }

    isEmpty(): boolean {
        return this.nodes.size === 0;
    }

    get isDirectory(): boolean {
        return true;
    }

    get title(): string {
        return "Organisation";
    }

    get label(): string {
        return this.folder;
    }

    get tooltip(): string {
        return "Folder: " + this.folder;
    }

    get commandName(): string {
        return "";
    }

    get iconPath(): string {
        return "";
    }

    get contextValue(): string {
        return "vsJenkinsX.pipelines.owner";
    }

    parent(): ModelNode {
        return this.model;
    }

    getChildren(): ModelNode[] {
        return mapValuesInKeyOrder(this.nodes);
    }

    upsertPipeline(repoName: string, branchName: string, buildNumber: string, pipeline: any) {
        if (repoName) {
            var repo = this.nodes.get(repoName);
            if (!repo) {
                repo = new RepoNode(addChildUrl(this.resource, repoName), this, repoName);
                this.nodes.set(repoName, repo);
            }
            repo.upsertPipeline(branchName, buildNumber, pipeline);
        }
    }

    deletePipeline(repoName: string, branchName: string, buildNumber: string, pipeline: any) {
        if (repoName) {
            var repo = this.nodes.get(repoName);
            if (repo) {
                repo.deletePipeline(branchName, buildNumber, pipeline);
            }
        }
    }
}


export class PipelineModel implements ModelNode {

    private nodes: Map<string, OwnerNode> = new Map<string, OwnerNode>();
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();

    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    resource: vscode.Uri = Uri.parse("pipeline:localhost");

    getChildren(): ModelNode[] {
        return mapValuesInKeyOrder(this.nodes);
    }

    parent(): ModelNode {
        return this;
    }

    get isDirectory(): boolean {
        return true;
    }


    get title(): string {
        return "Pipelines";
    }

    get label(): string {
        return "Pipelines";
    }

    get tooltip(): string {
        return "Jenkins X Pipelines";
    }

    get commandName(): string {
        return "";
    }

    get iconPath(): string {
        return "";
    }

    get contextValue(): string {
        return "vsJenkinsX.pipelines";
    }

    getNodeChildren(element?: ModelNode): ModelNode[] {
        return element ? element.getChildren() : this.getChildren();
    }

    upsertPipeline(folder: string, repoName: string, branchName: string, buildNumber: string, pipeline: any) {
        if (folder) {
            var owner = this.nodes.get(folder);
            if (!owner) {
                owner = new OwnerNode(addChildUrl(this.resource, folder), this, folder);
                this.nodes.set(folder, owner);
            }
            owner.upsertPipeline(repoName, branchName, buildNumber, pipeline);
        }
    }

    deletePipeline(folder: string, repoName: string, branchName: string, buildNumber: string, pipeline: any) {
        if (folder) {
            var owner = this.nodes.get(folder);
            if (owner) {
                owner.deletePipeline(repoName, branchName, buildNumber, pipeline);
                if (owner.isEmpty()) {
                    this.nodes.delete(folder);
                }
            }
        }
    }

    public connect(kubeWatcher: KubeWatcher) {
        kubeWatcher.addCallback((kind: CallbackKind, obj: any) => {
            let name = obj.metadata.name;
            let spec = obj.spec;

            if (!name || !spec) {
                return;
            }

            let buildNumber = spec.build;
            if (!buildNumber) {
                console.log("missing build number: " + buildNumber + " for name: " + name);
                return;
            }
            let folder = spec.gitOwner;
            let repoName = spec.gitRepository;
            let pipeline = spec.pipeline;
            let branchName = "";
            if (pipeline) {
                let values = pipeline.split("/");
                if (values && values.length > 2) {
                    folder = folder || values[0];
                    repoName = repoName || values[1];
                    branchName = values[2];
                }
            }

            if (!folder || !repoName || !branchName) {
                console.log(`missing data for pipeline ${name} folder: ${folder} repo: ${repoName} branchName: ${branchName} build: ${buildNumber}`);
                return;
            }

            if (kind === CallbackKind.ADD || kind === CallbackKind.UPDATE) {
                this.upsertPipeline(folder, repoName, branchName, buildNumber, obj);
                this.fireChangeEvent();
            } else if (kind === CallbackKind.DELETE) {
                this.deletePipeline(folder, repoName, branchName, buildNumber, obj);
                this.fireChangeEvent();
            }
        });
    }

    fireChangeEvent() {
        this._onDidChangeTreeData.fire();
    }


    public getContent(resource: Uri): Thenable<string> {
        return new Promise((c, e) => {
            return c("This is some generated pipeline text");
        });
    }
}

export class PipelineTreeDataProvider implements TreeDataProvider<ModelNode>, TextDocumentContentProvider {

    constructor(private readonly model: PipelineModel) { }

    public refresh(): any {
        this.model.fireChangeEvent();
    }

    get onDidChangeTreeData(): Event<any> {
        return this.model.onDidChangeTreeData;
    }

    public getTreeItem(element: ModelNode): TreeItem {
        const contextValue = element.contextValue;
        let answer: TreeItem = {
            label: element.label,
            resourceUri: element.resource,
            contextValue: contextValue,
            tooltip: element.tooltip,
            collapsibleState: element.isDirectory ? TreeItemCollapsibleState.Collapsed : void 0
        };
        let iconPath = element.iconPath;
        if (iconPath) {
            answer.iconPath = vscode.Uri.file(path.join(__dirname, "../" + iconPath));
            //console.log("__dirname is " + __dirname + " for " + iconPath + " so using " + answer.iconPath);
        }
        const commandName = element.commandName;
        if (commandName) {
            answer.command = {
                command: commandName,
                arguments: [element],
                title: element.label,
            };
        }
        return answer;
    }

    public getChildren(element?: ModelNode): ModelNode[] | Thenable<ModelNode[]> {
        return this.model.getNodeChildren(element);
    }

    public getParent(element: ModelNode): ModelNode {
        return element.parent();
    }

    public provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
        return this.model.getContent(uri).then(content => content);
    }
}

function stringCapitalise(text?: string): string {
    if (text) {
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }
    return "";
}

function elapsedTime(prefix: string, start?: string, completed?: string): string {
    if (start && completed) {
        let m1 = moment(start);
        let m2 = moment(completed);

        if (m1.isValid() && m2.isValid()) {
            var duration = moment.duration(m1.diff(m2));
            const answer = duration.humanize();
            if (answer) {
                return prefix + answer;
            }
        }
    }
    return "";
}

function mapValuesInKeyOrder(nodes: Map<string, ModelNode>): ModelNode[] {
    let keys: string[] = [];
    nodes.forEach((value: ModelNode, key: string) => {
        keys.push(key);
    });
    keys.sort();
    let answer: ModelNode[] = [];
    keys.forEach((key: string) => {
        let value = nodes.get(key);
        if (value) {
            answer.push(value);
        }
    });
    return answer;
}