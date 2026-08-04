# Asset Upload & Storage Guide

## 1. Core Principles (Object Storage First)

To ensure consistency between Development (Local), On-premise, and Cloud environments, we enforce a **strict Object Storage strategy**.

- **No Local Filesystem**: We do NOT use the local filesystem for asset storage, even in development.
- **Unified Protocol**: All environments use S3-compatible APIs (MinIO for Local/On-prem, S3/GCS for Cloud).
- **Direct Upload**: The frontend uploads files directly to the storage provider using Presigned URLs. The backend **never** receives file binary data.

## 2. Upload Workflow (Direct Upload)

We use a 3-step **Init -> Upload -> Complete** workflow:

### Step 1: Initialization (`POST /cms/assets/init`)
The frontend requests permission to upload a file.
- **Request**: `{ filename, mime_type, size }`
- **Response**: `{ asset_id, upload_url, storage_key, headers }`
    - `upload_url`: A simplified Presigned PUT URL.

### Step 2: Direct Upload (Frontend)
The frontend uploads the file binary to the `upload_url` via `PUT`.
- **Important**: Must send the correct `Content-Type` header matching the initialization step.

### Step 3: Completion (`POST /cms/assets/:id/complete`)
After a successful upload, the frontend notifies the backend.
- **Backend Action**: Verifies the file exists on storage (via `HEAD` request), checks size/hash, and marks the asset status as `ready`.

### Step 4: Access (`GET /cms/assets/:id/url`)
To display the image, request a short-lived Presigned GET URL.

## 3. Local Development Setup (MinIO)

We use **MinIO** to simulate S3 locally.

### 3.1 Docker Compose
Add the following to your `docker-compose.yml`:

```yaml
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: "minioadmin"
      MINIO_ROOT_PASSWORD: "minioadmin"
    command: server /data --console-address ":9001"
    volumes:
      - ./.docker/minio/data:/data
```

### 3.2 Environment Variables (`apps/api/.env`)

```bash
# Storage Configuration
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_BUCKET=r3-assets
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_FORCE_PATH_STYLE=true # Required for MinIO
```

## 4. Migration & Deployment

- **Database**: The `assets` table tracks `storage_provider` and `bucket`, allowing for seamless migration or multi-cloud setups.
- **CDN**: In production, `STORAGE_PUBLIC_URL` can be configured to serve assets via CloudFront or Cloudflare.
