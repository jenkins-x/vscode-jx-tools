pipeline {
    agent any
    environment {
      VISUALSTUDIO_CREDS = credentials('jenkins-x-visualstudio')
    }
    stages {
      stage('CI') {
        when {
          branch 'PR-*'
        }
        steps {
          
          sh "/usr/bin/Xvfb :99 -screen 0 1280x1024x24 &"

          sh "npm install"
          sh "npm run postinstall"
          sh "DISPLAY=:99 npm test"

          sh "vsce package"
        }
      }
      stage('Build Release') {
        when {
          branch 'master'
        }
        steps {
          // ensure we're not on a detached head
          git "https://github.com/jenkins-x/vscode-jx-tools"
          sh "git config --global credential.helper store"
          sh "jx step git credentials"

          sh "jx step next-version --filename package.json --tag"
          sh "/usr/bin/Xvfb :99 -screen 0 1280x1024x24 &"

          sh "npm install"
          sh "npm run postinstall"
          sh "DISPLAY=:99 npm test"

          sh "vsce publish -p $VISUALSTUDIO_CREDS_PSW"
        }
      }
    }
  }
