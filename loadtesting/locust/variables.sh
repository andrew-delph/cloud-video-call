echo "setting variables"

export GKE_CLUSTER=gke-locust-cluster
export AR_REPO=dist-locust-repo
export REGION=us-central1
export ZONE=us-central1-b

export GKE_NODE_TYPE=e2-standard-2
export GKE_SCOPE="https://www.googleapis.com/auth/cloud-platform"
export PROJECT=$(gcloud config get-value project)
export SAMPLE_APP_TARGET=${PROJECT}.appspot.com

export SERVICE_ACCOUNT=dist-locust-svc-acc

export LOCUST_IMAGE_NAME=locust-tasks
export LOCUST_IMAGE_TAG=latest

export APP_TARGET=wss://react-video-call-fjutjsrlaa-uc.a.run.app

gcloud config set compute/zone ${ZONE}


echo "project: ${PROJECT}"
