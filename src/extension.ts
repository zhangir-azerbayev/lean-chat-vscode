// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { join } from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed


export async function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "lean-chat-vscode" is now active!');

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    if (OPENAI_API_KEY === undefined) {
        vscode.window.showInformationMessage('You need to have an OPENAI_API_KEY environment variable!');
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('lean-chat-vscode.open', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user

        // [todo] don't make a new panel if one already exists.
        const panel = vscode.window.createWebviewPanel(
            'leanChat', 'Lean Chat',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        const indexPath = panel.webview.asWebviewUri(vscode.Uri.file(join(context.extensionPath, 'media', 'index.js')))
        const codexImgPath = panel.webview.asWebviewUri(vscode.Uri.file(join(context.extensionPath, 'media', 'codex.jpeg')))

        const webviewContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="Content-type" content="text/html;charset=utf-8">
                    <title>Lean Chat</title>
                    <script type="text/javascript">
                        const LEAN_CHAT_CONFIG = {
                            apiKey: ${JSON.stringify(OPENAI_API_KEY)},
                            chatImage: ${JSON.stringify(codexImgPath.toString())}
                        };
                    </script>
                    <style>${mkStylesheet()}</style>
                </head>
                <body>
                    <div id="react_root"></div>
                    <script src="${indexPath}"></script>
                </body>
            </html>`

        panel.webview.html = webviewContent

        // panel.webview.postMessage({command : "key", key : OPENAI_API_KEY})
    }
    ))
}

// this method is called when your extension is deactivated
export async function deactivate() { }



function mkStylesheet() {
    const fontFamily =
        (vscode.workspace.getConfiguration('editor').get('fontFamily') as string).
            replace(/['"]/g, '');
    const fontCodeCSS = `
            .font-code {
                font-family: ${fontFamily};
                font-size: ${vscode.workspace.getConfiguration('editor').get('fontSize')}px;
            }
        `;
    return fontCodeCSS;
}