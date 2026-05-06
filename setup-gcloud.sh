#!/bin/bash
# Run once to set up Google Cloud infrastructure
# Prerequisites: gcloud CLI installed, Docker running

PROJECT_ID="matrix-logistic-6355c"
REGION="me-west1"
REPO="matrix-supply"

echo "=== 1. Authenticate ==="
gcloud auth login
gcloud config set project $PROJECT_ID

echo "=== 2. Enable required APIs ==="
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

echo "=== 3. Create Artifact Registry repository ==="
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="Matrix Supply Order Docker images"

echo "=== 4. Configure Docker auth ==="
gcloud auth configure-docker $REGION-docker.pkg.dev

echo "=== 5. Grant Cloud Run service account access to Firebase/Firestore ==="
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/firebase.admin"

echo "=== 6. Store JWT secrets in Secret Manager ==="
echo ""
echo "PROD secret:"
read -s -p "Enter PROD JWT_SECRET (strong random string): " PROD_SECRET
echo ""
echo -n "$PROD_SECRET" | gcloud secrets create jwt-secret-prod \
  --data-file=- \
  --replication-policy=user-managed \
  --locations=$REGION

echo ""
echo "DEV secret:"
read -s -p "Enter DEV JWT_SECRET (can be simpler): " DEV_SECRET
echo ""
echo -n "$DEV_SECRET" | gcloud secrets create jwt-secret-dev \
  --data-file=- \
  --replication-policy=user-managed \
  --locations=$REGION

# Grant Cloud Run SA access to the secrets
gcloud secrets add-iam-policy-binding jwt-secret-prod \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-secret-dev \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"

echo ""
echo "=== Setup complete! Now run deploy-prod.sh or deploy-dev.sh ==="
