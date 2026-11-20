This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Pi Network deployment

`NEXT_PUBLIC_PI_NETWORK` selects the Pi SDK network at build time:

- `testnet` (the default) for local development and preview deployments.
- `mainnet` only for the production deployment after the Pi Developer Portal app, domain validation, and server API key are configured for Mainnet.

Set this variable in the deployment environment **before building**. Next.js embeds `NEXT_PUBLIC_` variables in the client bundle at build time, so changing a runtime setting alone does not switch an already-built site. Redeploy after changing networks, and keep the preview environment on `testnet`.

Before enabling Mainnet, verify Pi sign-in, a small payment through approval and completion, and the resulting record in the production app. If a rollback is needed, redeploy the previous production build or build with `NEXT_PUBLIC_PI_NETWORK=testnet`; ensure the corresponding Pi app/API credentials are also appropriate for that network. Keep the prior build available until production checks pass.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
