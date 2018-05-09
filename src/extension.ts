'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const k8s = require('@kubernetes/client-node');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-jx-tools" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposableHello = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    let disposableActivity = vscode.commands.registerCommand('extension.watchActivity', () => {

        //let kc = k8s.Config.defaultClient();
        let kc = new k8s.KubeConfig();
        let configFile = process.env['HOME'] + '/.kube/config';
        try {
            kc.loadFromFile(configFile);
        } catch(e) {
            console.log('error reading ' + configFile + ': ' + e.message);
            throw e;
        }

        let watch = new k8s.Watch(kc);
        let req = watch.watch('/apis/jenkins.io/v1/namespaces/jx/pipelineactivities',
            // optional query parameters can go here.
            {},
            // callback is called for each received object.
            (type: any, obj: any) => {
                if (type === 'ADDED') {
                    console.log('new object:');
                } else if (type === 'MODIFIED') {
                    console.log('changed object:');
                } else if (type === 'DELETED') {
                    console.log('deleted object:');
                } else {
                    console.log('unknown type: ' + type);
                }
                let repoName = obj.metadata.name;

                console.log(obj);
                for (let step of obj.spec.steps) {
                    switch(step.kind) { 
                        case 'stage': { 
                            vscode.window.showInformationMessage(repoName + ': ' + step.stage.name);
                            console.log(repoName + ': ' + step.stage.name);
                            break; 
                        } 
                        case 'Promote': { 
                            vscode.window.showInformationMessage(repoName + ': promoted to '+ step.promote.environment);
                            console.log(repoName + ': promoted to '+ step.promote.environment);
                            break; 
                        } 
                        default: { 
                            //statements; 
                            break; 
                        } 
                    }
                }
            },
            // done callback is called if the watch terminates normally
            (err: any) => {
                if (err) {
                    console.log(err);
                }
            });
        
        // watch returns a request object which you can use to abort the watch.
        // setTimeout(() => { req.abort(); }, 10 * 1000);
        
    });

    context.subscriptions.push(disposableHello);
    context.subscriptions.push(disposableActivity);
}

// this method is called when your extension is deactivated
export function deactivate() {
}