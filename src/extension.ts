import * as vscode from "vscode";

enum Mode {
	Normal,
	Insert,
	Visual
}

class Modal {
	private _currentMode: Mode = Mode.Normal;

	get currentMode() {
		return this._currentMode;
	}

	set currentMode(newMode) {
		this._currentMode = newMode;
		this.updateAll();
	}

	private updateContexts() {
		vscode.commands.executeCommand(
			"setContext",
			"modal.inNormalMode",
			this.currentMode === Mode.Normal
		);

		vscode.commands.executeCommand(
			"setContext",
			"modal.inInsertMode",
			this.currentMode === Mode.Insert
		);

		vscode.commands.executeCommand(
			"setContext",
			"modal.inVisualMode",
			this.currentMode === Mode.Visual
		);
	}

	private updateCursorStyle(textEditor?: vscode.TextEditor) {
		let cursorStyle = vscode.TextEditorCursorStyle.Line;

		switch (this.currentMode) {
			case Mode.Normal:
				cursorStyle = vscode.TextEditorCursorStyle.Block;
				break;

			case Mode.Visual:
				cursorStyle = vscode.TextEditorCursorStyle.BlockOutline;
				break;
		}

		if (textEditor) {
			textEditor.options.cursorStyle = cursorStyle;
		}

		vscode.window.visibleTextEditors.forEach(textEditor => {
			textEditor.options.cursorStyle = cursorStyle;
		});
	}

	private updateStatusBarItem() {
		switch (this.currentMode) {
			case Mode.Normal:
				this.statusBarItem.text = "Normal";
				this.statusBarItem.command = "modal.enterInsertMode";
				this.statusBarItem.tooltip = "Modal is currently in Normal mode";
				break;

			case Mode.Insert:
				this.statusBarItem.text = "Insert";
				this.statusBarItem.command = "modal.enterNormalMode";
				this.statusBarItem.tooltip = "Modal is currently in Insert mode";
				break;

			case Mode.Visual:
				this.statusBarItem.text = "Visual";
				this.statusBarItem.command = "modal.enterNormalMode";
				this.statusBarItem.tooltip = "Modal is currently in Visual mode";
				break;
		}
	}

	private updateAll(textEditor?: vscode.TextEditor) {
		this.updateContexts();
		this.updateCursorStyle(textEditor);
		this.updateStatusBarItem();
	}

	private statusBarItem: vscode.StatusBarItem;

	constructor() {
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		this.statusBarItem.show();

		this.updateAll();
	}

	enterNormalMode() {
		this.currentMode = Mode.Normal;
	}

	enterInsertMode() {
		this.currentMode = Mode.Insert;
	}

	enterVisualMode() {
		this.currentMode = Mode.Visual;
	}

	processTextInput(args: any) {
		if (this.currentMode === Mode.Insert) {
			this.invokeTextInput(args);
		}
	}

	private invokeTextInput(args: any) {
		vscode.commands.executeCommand("default:type", args);
	}

	register(context: vscode.ExtensionContext) {
		context.subscriptions.push(
			vscode.commands.registerCommand("modal.enterNormalMode", this.enterNormalMode, this),
			vscode.commands.registerCommand("modal.enterInsertMode", this.enterInsertMode, this),
			vscode.commands.registerCommand("modal.enterVisualMode", this.enterVisualMode, this),
			vscode.commands.registerCommand("type", this.processTextInput, this),

			vscode.window.onDidChangeActiveTextEditor(textEditor => {
				this.currentMode = Mode.Normal;
			}, this),

			vscode.window.onDidChangeVisibleTextEditors(textEditors => {
				this.updateAll();
			}, this),
		);
	}
}

export function activate(context: vscode.ExtensionContext) {
	let modal = new Modal();
	modal.register(context);
}

export function deactivate() { }
