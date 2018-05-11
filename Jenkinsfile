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
            sh "jx step git credentials"
            // so we can retrieve the version in later steps
            sh "echo \$(jx-release-version) > VERSION"
            sh "sed -i -e 's/\"version\": \".*/\"version\": \"\$(cat VERSION)\",/' package.json"
            sh "jx step tag --version \$(cat VERSION)"
            
            sh "npm install"
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
