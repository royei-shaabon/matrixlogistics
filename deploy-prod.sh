#!/bin/bash
# Deploy to PRODUCTION
# Usage: ./deploy-prod.sh

PROJECT_ID="matrix-logistic-6355c"
REGION="me-west1"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/matrix-supply/app:prod"
SERVICE="get-supply-prod"

echo "=== Building PROD image ==="
docker build -t $IMAGE .

echo "=== Pushing to Artifact Registry ==="
docker push $IMAGE

echo "=== Deploying to Cloud Run (PROD) ==="
gcloud run deploy $SERVICE \
  --image=$IMAGE \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=3 \
  --memory=512Mi \
  --set-secrets="JWT_SECRET=jwt-secret-prod:latest" \
  --set-env-vars="NODE_ENV=production"

echo ""
echo "=== PROD deployed! ==="
gcloud run services describe $SERVICE --region=$REGION --format='value(status.url)'
