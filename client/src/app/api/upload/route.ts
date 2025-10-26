import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  _Object,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
});

function buildS3ObjectUrl(bucket: string, region: string, key: string): string {
  // Standard virtual-hosted–style URL; works for most regions. us-east-1 also supports s3.amazonaws.com
  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${encodeURI(key)}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
}

async function uploadFileToS3(fileBuffer: Buffer, originalName: string) {
  const bucket = process.env.AWS_S3_BUCKET_NAME || "";
  const region = process.env.AWS_S3_REGION || "";
  if (!bucket || !region) {
    throw new Error("Missing AWS_S3_BUCKET_NAME or AWS_S3_REGION env var");
  }

  // Preserve extension and add timestamp to avoid collisions
  const timestamp = Date.now();
  const key = `books/${timestamp}-${originalName}`;

  const params = {
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: "application/pdf",
    ...(process.env.AWS_S3_PUBLIC_ACL === "true"
      ? { ACL: "public-read" as const }
      : {}),
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  const url = buildS3ObjectUrl(bucket, region, key);
  return { url, key };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as unknown as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, key } = await uploadFileToS3(buffer, file.name);
    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      url,
      key,
      originalName: file.name,
      size: (file as File).size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME || "";
    const region = process.env.AWS_S3_REGION || "";
    if (!bucket || !region) {
      return NextResponse.json(
        { error: "Missing AWS_S3_BUCKET_NAME or AWS_S3_REGION env var" },
        { status: 500 }
      );
    }

    const prefix = "books/";
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    const objects: _Object[] = [];

    while (isTruncated) {
      const resp: ListObjectsV2CommandOutput = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );

      if (resp.Contents) objects.push(...resp.Contents);
      isTruncated = !!resp.IsTruncated;
      continuationToken = resp.NextContinuationToken;
    }

    const files = (objects || [])
      .filter((o) => !!o.Key)
      .map((o) => {
        const key = o.Key as string;
        const url = buildS3ObjectUrl(bucket, region, key);
        const fileName = key.split("/").pop() || key;
        return {
          key,
          url,
          name: fileName,
          size: o.Size || 0,
          uploadedAt: (o.LastModified || new Date()).toISOString(),
        };
      })
      // latest first
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error listing uploaded files:", error);
    return NextResponse.json({ error: "Error listing files" }, { status: 500 });
  }
}
