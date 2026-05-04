This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

## Approval Emails

When an admin approves a listing, the app calls `POST /api/listings/approval-email`
and sends the user an email through Gmail SMTP from `softspring777@gmail.com`.

Required environment variable:

```bash
SMTP_USER=softspring777@gmail.com
SMTP_APP_PASSWORD=your_google_app_password
```

Optional environment variables:

```bash
LISTING_APPROVAL_EMAIL_FROM=softspring777@gmail.com
NEXT_PUBLIC_APP_URL=https://your-site-url.com
```

To create the Gmail app password:

1. Open the Google Account for `softspring777@gmail.com`.
2. Go to Security.
3. Turn on 2-Step Verification if it is not already enabled.
4. Search for App passwords, or open Security > App passwords.
5. Create an app password for Mail.
6. Copy the 16-character password and use it as `SMTP_APP_PASSWORD`.

Do not use the normal Gmail password. Gmail SMTP requires an app password.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
