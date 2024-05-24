import * as vscode from 'vscode';


export default class TextTreeItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,

	) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

	// contextValue = 'dependency';
}
