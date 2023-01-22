echo "AR_REPO: ${AR_REPO}"
echo "REGION: ${REGION}"

read -p "do you want to create the registry? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # do dangerous stuff
    echo "creating registry"
else
    exit 1
fi


gcloud artifacts repositories create ${AR_REPO} \
    --repository-format=docker  \
    --location=${REGION} \
    --description="Distributed load testing with GKE and Locust"