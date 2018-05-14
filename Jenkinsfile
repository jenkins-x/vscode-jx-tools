pipeline {
    agent {
        label "jenkins-nodejs"
    }
    environment {
      VISUALSTUDIO_CREDS = credentials('jenkins-x-visualstudio')
    }
    stages {
      stage('CI') {
        when {
          branch 'PR-*'
        }
        steps {
          
          container('nodejs') {
            sh "npm install"
            // unable to get vscode running in CI yet
            // sh "npm test"

            sh "vsce package"
          }
        }
      }
      stage('Build Release') {
        when {
          branch 'master'
        }
        steps {
          container('nodejs') {
            // ensure we're not on a detached head
            sh "git checkout master"
            sh "git config --global credential.helper store"

            sh "jx step next-version --filename package.json --tag"

            sh "npm install"
            input "ok?"
            // unable to get vscode running in CI yet
            // sh "npm test"
            
            sh "vsce publish -p $VISUALSTUDIO_CREDS_PSW"
          }
        }
      }
    }
    post {
        always {
            cleanWs()
        }
    }
  }
