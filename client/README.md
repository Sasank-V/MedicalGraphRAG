This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Using DynamoDB instead of MongoDB

This project supports switching the user repository from MongoDB (default) to AWS DynamoDB without changing application code.

1. Install dependencies (already added):

	 - `@aws-sdk/client-dynamodb`
	 - `@aws-sdk/lib-dynamodb`

2. Set environment variables (e.g., in `.env.local`):

```
# Choose repository provider: mongodb | dynamodb
DB_PROVIDER=dynamodb

# AWS config
AWS_REGION=us-east-1

# DynamoDB table names
DYNAMODB_USERS_TABLE=Users
DYNAMODB_CHATS_TABLE=Chats
DYNAMODB_MESSAGES_TABLE=Messages

# Optional (for DynamoDB Local)
# DYNAMODB_ENDPOINT=http://localhost:8000

# Provide AWS credentials via environment or your platform's identity provider
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

3. Create the Users table with `email` as the partition key (String). For DynamoDB Local, you can use AWS CLI:

```powershell
aws dynamodb create-table `
	--table-name Users `
	--attribute-definitions AttributeName=email,AttributeType=S `
	--key-schema AttributeName=email,KeyType=HASH `
	--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
	--endpoint-url http://localhost:8000
```

4. Create the Chats and Messages tables:

```powershell
# Chats: PK id (S)
aws dynamodb create-table `
	--table-name Chats `
	--attribute-definitions AttributeName=id,AttributeType=S `
	--key-schema AttributeName=id,KeyType=HASH `
	--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
	--endpoint-url http://localhost:8000

# Messages: PK chatId (S), SK messageId (S)
aws dynamodb create-table `
	--table-name Messages `
	--attribute-definitions AttributeName=chatId,AttributeType=S AttributeName=messageId,AttributeType=S `
	--key-schema AttributeName=chatId,KeyType=HASH AttributeName=messageId,KeyType=RANGE `
	--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
	--endpoint-url http://localhost:8000
```

With `DB_PROVIDER=dynamodb`, the server will use the DynamoDB repository for user CRUD behind the same interface used by the rest of the app.
When enabled, chat creation and messages will also use DynamoDB tables (Chats, Messages) transparently in the API routes.
