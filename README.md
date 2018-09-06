# vscode-jx-tools

A collection of VSCode tools to help working with Jenkins X

## Settings 

The following settings can be configured in the workspace:

Defines a custom path for `jx` binary
```json
"jx.path": "/my/path/" 
```

Specifies which container ports will be exposed by the `DevPod`
```json
"jx.devPodPorts": [8080]
```

## Jenkins X Explorer

By opening the `Jenkins X` explorer in the UI you can browse folders, repositories, branches, pipelines and build logs:

![usage](https://raw.githubusercontent.com/jenkins-x/vscode-jx-tools/master/images/explorer.png)


### Features
* browse all the pipelines in your team with real time updates as release or pull request pipelines start/stop.
* open pipeline build logs inside the VS Code Terminal
* browse the Jenkins pipeline page, git repository, build logs or applications easily
  * right click on the Jenkins X explorer
  * start/stop pipelines too! 
* open [DevPods](https://jenkins-x.io/developing/devpods/) with source code synchronisation in a single command in VS Code for developing inside the cloud with the same container images and pod templates as the CI/CD pipelines  


## Activity watch
Activate the watch activities by opening up the VSCode palette `cmd` + `shift` + `p`, type `jx watch activities` and the extension command will be activated.

![usage](https://raw.githubusercontent.com/jenkins-x/vscode-jx-tools/master/images/usage.png)

## Commands

There are a number of commands available which can be invoked from VCode palette with `cmd` + `shift` + `p`.

![commands](https://raw.githubusercontent.com/jenkins-x/vscode-jx-tools/master/images/commands.png)
