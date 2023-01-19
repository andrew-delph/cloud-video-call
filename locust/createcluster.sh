echo "Service account: ${SERVICE_ACCOUNT}"
echo "Project: ${PROJECT}"
echo "Region: ${REGION}"
echo "Cluster name: ${GKE_CLUSTER}"

read -p "do you want to create the cluster? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # do dangerous stuff
    echo "creating cluster"
else
    exit 1
fi

gcloud container clusters create ${GKE_CLUSTER} \
--service-account=${SERVICE_ACCOUNT}@${PROJECT}.iam.gserviceaccount.com \
--region ${REGION} \
--machine-type ${GKE_NODE_TYPE} \
--enable-autoscaling \
--num-nodes 2 \
--min-nodes 2 \
--max-nodes 4 \
--scopes "${GKE_SCOPE}" \
--disk-size 10GB

# auth
gcloud container clusters get-credentials ${GKE_CLUSTER} \
   --region ${REGION} \
   --project ${PROJECT}