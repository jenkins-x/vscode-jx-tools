import { TreeDataProvider, TreeItem } from 'vscode';
import { ExplorerModel, ExplorerContext } from './model';
import { PipelineTreeDataProvider } from './pipelines';

class ExplorerTreeDataProvider implements TreeDataProvider<ExplorerModel> {
    constructor(private pipelineProvider: PipelineTreeDataProvider) {}

    public refresh(): void {
        this.pipelineProvider.refresh();
    }

    public getParent(element: ExplorerModel): ExplorerModel {
        return element.parent();
    }

	public getTreeItem(element: ExplorerModel): TreeItem {
        if (element.contextValue.indexOf(ExplorerContext.Previews) !== -1) {
            return this.pipelineProvider.getTreeItem(element);
        }

        return element;
    }

	public getChildren(element?: ExplorerModel): ExplorerModel[] | Thenable<ExplorerModel[]> {
        if (!element) {
            return [
                // new ExplorerModel('Environments', ExplorerContext.Environments),
                new ExplorerModel('Previews', ExplorerContext.Previews)
            ];
        }

        if (element.contextValue === ExplorerContext.Previews) {
            return this.pipelineProvider.getChildren();
        }
        if (element.contextValue.indexOf(ExplorerContext.Previews) !== -1) {
            return this.pipelineProvider.getChildren(element);
        }

        return [];
    }
    
}

export {
    ExplorerTreeDataProvider
};
