# Firebase Admin SDK Setup Instructions

## Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **studio-5400987535-1a69e**
3. Click the gear icon (⚙️) next to "Project Overview" → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (it will be named something like `studio-5400987535-1a69e-firebase-adminsdk-xxxxx.json`)

## Step 2: Extract Credentials

Open the downloaded JSON file and find these values:

```json
{
  "project_id": "studio-5400987535-1a69e",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@studio-5400987535-1a69e.iam.gserviceaccount.com",
  ...
}
```

## Step 3: Update .env.local

Edit `/home/apps/monitoring/.env.local` and replace the placeholder values:

```bash
# Application Configuration
PORT=5005
NODE_ENV=production

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=studio-5400987535-1a69e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-5400987535-1a69e.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT:**
- Keep the `FIREBASE_PRIVATE_KEY` value in double quotes
- Keep the `\n` characters in the private key - they represent newlines
- Do NOT remove or add extra quotes

## Step 4: Verify Configuration

After updating `.env.local`, you can test if the credentials work:

```bash
cd /home/apps/monitoring
npm run build
```

If the build succeeds, the credentials are correctly formatted.

## Security Notes

- The `.env.local` file is already in `.gitignore` - it will NOT be committed to git
- Never share the service account JSON file or private key
- The service account has admin access to your Firebase project
- Store the downloaded JSON file securely (not in the git repository)
