#!/bin/bash
# Deploy to DEVELOPMENT
# Usage: ./deploy-dev.sh

PROJECT_ID="matrix-logistic-6355c"
REGION="me-west1"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/matrix-supply/app:dev"
SERVICE="get-supply-dev"

echo "=== Building DEV image ==="
docker build -t $IMAGE .

echo "=== Pushing to Artifact Registry ==="
docker push $IMAGE

echo "=== Deploying to Cloud Run (DEV) ==="
gcloud run deploy $SERVICE \
  --image=$IMAGE \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=1 \
  --memory=512Mi \
  --set-secrets="JWT_SECRET=jwt-secret-dev:latest" \
  --set-env-vars="NODE_ENV=production"

echo ""
echo "=== DEV deployed! ==="
gcloud run services describe $SERVICE --region=$REGION --format='value(status.url)'
