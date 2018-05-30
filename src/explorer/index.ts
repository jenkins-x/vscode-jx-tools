import { window } from 'vscode';
import { KubeWatcher } from '../kube';
import { TerminalCache } from '../term';
import { PipelineExplorer } from './pipelines';
import { ExplorerTreeDataProvider } from './provider';

function createExplorerView(pipelines: KubeWatcher, terminals: TerminalCache) {
    const pipelineExplorer = new PipelineExplorer(pipelines, terminals);
    const treeDataProvider = new ExplorerTreeDataProvider(pipelineExplorer.treeProvider);

    return [
        ...pipelineExplorer.subscribe(),
        window.createTreeView('extension.vsJenkinsXExplorer', { treeDataProvider }),
        window.registerTreeDataProvider('extension.vsJenkinsXExplorer', treeDataProvider)
    ];
}

export {
    createExplorerView
};
