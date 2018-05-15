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
            sh "/usr/bin/Xvfb :99 -screen 0 1280x1024x24 &"

            sh "npm install"
            sh "npm run postinstall"
            sh "npm test"

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
            sh "/usr/bin/Xvfb :99 -screen 0 1280x1024x24 &"

            sh "npm install"
            sh "npm run postinstall"
            sh "npm test"

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
