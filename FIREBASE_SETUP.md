# Mohammed Fazil Cattery — Firebase Setup

The application now uses Firebase Admin + Firestore instead of MongoDB. The existing custom session authentication remains in place so two independent admin accounts can be configured without exposing credentials to the browser.

## 1. Create the Firebase project

1. Open the Firebase Console.
2. Create a project for Mohammed Fazil Cattery.
3. Enable **Firestore Database**.
4. Create the database in the region closest to the business/users.

## 2. Create server credentials

In Firebase Console:

1. Open **Project settings**.
2. Go to **Service accounts**.
3. Generate a new private key.
4. Copy the service-account values into server-only environment variables:

```text
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

Never commit the private key or put it in a `NEXT_PUBLIC_*` variable.

## 3. Configure the two admin accounts

The current login system supports two independent accounts:

```text
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=

OWNER_EMAIL=
OWNER_PASSWORD_HASH=
```

Generate a password hash with:

```bash
npm run hash-password "your-strong-password"
```

Then put the resulting hash in the matching environment variable. Passwords are never stored in the repository.

## 4. Local development

Copy `env.example` to `.env.local` and fill in:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
OWNER_EMAIL
OWNER_PASSWORD_HASH
AUTH_SECRET
```

Start the app:

```bash
npm install
npm run dev
```

## 5. Placeholder data

When `SEED_ON_EMPTY=true`, the server creates clearly-labelled placeholder kittens, products and gallery records when all three public collections are empty.

You can also run:

```bash
npm run seed
```

Use `npm run seed -- --force` only when intentionally replacing those three collections with fresh placeholders.

## 6. Images

The website still supports the existing storage abstraction.

For local testing:

```text
IMAGE_STORAGE_DRIVER=local
```

For Vercel production, use the existing Cloudinary driver so uploads persist across deployments:

```text
IMAGE_STORAGE_DRIVER=cloudinary
```

The UI continues to use branded placeholders until real kitten/product/gallery photographs are uploaded.

## 7. Vercel

Add the Firebase server variables to the Vercel project's environment settings. Add both admin accounts and `AUTH_SECRET` there as well.

Do not put the Firebase service-account private key in source control.

After deployment, test:

- `/admin/login`
- Admin account 1 login
- Admin account 2 login
- kitten CRUD
- product CRUD
- gallery CRUD
- image upload
- public kitten/product pages

## 8. Data model

Firestore collections:

- `kittens`
- `products`
- `gallery`
- `users` (optional; environment-configured admin accounts do not require records here)

The public pages and admin API access these through the application's `DataStore` abstraction.
