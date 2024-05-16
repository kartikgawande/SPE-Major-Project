pipeline {
    agent any
    environment {
        mongo_url = "mongodb+srv://japankaj282:pankaj7272@cluster0.ywkpfjr.mongodb.net/MERN_STACK_JOB_SEEKING?retryWrites=true&w=majority&appName=Cluster0"
        JWT_SECRET = "pankajpankajjakanp"
    }
    stages {
        stage('Stage 1: Git Clone') {
            steps {
                git branch: 'master',
                url: 'https://github.com/kartikgawande/SPE-Major-Project.git'
            }
        }
        stage('Stage 2: Remove npm proxy') {
            steps {
                sh 'npm config rm proxy'
                sh 'npm config rm http-proxy'
                sh 'npm config rm https-proxy'
            }
        }
        stage('Stage 2: frontend Build') {
            steps {
                dir('frontend'){
                sh "npm install"
                sh 'docker build -t frontend-image .'
            }
            }
        }
        stage("Stage 3: backend Build") {
            steps {
                dir('backend'){
                sh "npm install"
                sh 'docker build -t backend-image .'
            }}
        }
        stage('Stage 4: Push image to DockerHub') {
            steps {
                script {
                        sh "docker login --username pankaj5000 --password pankaj.1234"
                        sh 'docker tag frontend-image pankaj5000/frontend-image:latest'
                        sh 'docker push pankaj5000/frontend-image:latest'
                        sh "docker tag backend-image pankaj5000/backend-image:latest"
                        sh "docker push pankaj5000/backend-image:latest"
                    
                }
            }
        }
        stage('Stage 5: Clean Docker Images') {
            steps {
                script {
                    sh 'docker container prune -f'
                    sh 'docker image prune -f'
                }
            }
        }
        stage('Stage 6: Ansible Deployment') {
            steps {
                script { 
                    sh 'ansible-playbook -i inventory playbook.yml'
                }
            }
        }
    }
}

