pipeline {
    agent any
    environment {
      CI = 'true'
    }
    stages {
        stage('Install') {
            steps {
                bat 'npm install'
            }
        }
        stage('Lint') {
            steps {
                bat 'npm run lint'
            }
        }
        stage('Test') {
            steps {
                bat 'npm run test'
            }
        }
        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }
    }
}
