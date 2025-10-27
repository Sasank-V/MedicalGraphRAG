import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let docClient: DynamoDBDocumentClient | null = null;

export function getDynamoDocClient(): DynamoDBDocumentClient {
  if (docClient) return docClient;

  const region = process.env.AWS_REGION || "ap-south-1";
  const endpoint = process.env.DYNAMODB_ENDPOINT; // optional (e.g., for local dynamodb)

  const client = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: process.env.APP_AWS_DDB_ACCESS_KEY!,
      secretAccessKey: process.env.APP_AWS_DDB_SECRET_ACCESS_KEY!,
    },
    ...(endpoint ? { endpoint } : {}),
  });

  docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });

  return docClient;
}
