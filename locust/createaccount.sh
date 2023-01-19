echo "Service account: ${SERVICE_ACCOUNT}"

read -p "do you want to create the account? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # do dangerous stuff
    echo "creating account"
else
    exit 1
fi



gcloud iam service-accounts create $SERVICE_ACCOUNT
gcloud projects add-iam-policy-binding  ${PROJECT} --member=serviceAccount:${SERVICE_ACCOUNT}@${PROJECT}.iam.gserviceaccount.com --role=roles/artifactregistry.reader
gcloud projects add-iam-policy-binding  ${PROJECT} --member=serviceAccount:${SERVICE_ACCOUNT}@${PROJECT}.iam.gserviceaccount.com --role=roles/container.nodeServiceAccount