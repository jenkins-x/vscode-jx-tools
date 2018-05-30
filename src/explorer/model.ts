import { Uri } from 'vscode';
import { ModelNode } from './pipelines';

enum ExplorerContext {
    Previews = 'vsJenkinsX.pipelines',
    Environments = 'vsJenkinsX.enviroments'
}

class ExplorerModel implements ModelNode {
	constructor(
		public readonly label: string,
        public readonly contextValue: string = ''
	) {
    }

    get isDirectory(): boolean {
        return true;
    }

    get title(): string {
        return this.label;
    }

    get iconPath(): string | { light: string; dark: string } {
        return '';
    }

    get commandName(): string {
        return '';
    }

    get resource(): Uri {
        return Uri.parse('');
    }

	get tooltip(): string {
		return this.label;
    }
    
    getChildren(): ModelNode[] {
        return [];
    }

    parent(): ModelNode {
        return this;
    }
}

export {
    ExplorerContext,
    ExplorerModel
};
