import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import internal from 'stream';

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

export const PROFILE_PICTURES_BUCKET = `thing72-profile-pictures`;

export const s3Client = new S3Client({
  region: `us-east-1`,
  credentials: credentials,
});

export async function uploadProfilePicture(
  key: string,
  body:
    | string
    | internal.Readable
    | ReadableStream<any>
    | Blob
    | Uint8Array
    | Buffer
    | undefined,
) {
  // Create a command to upload an object to S3
  const uploadCommand = new PutObjectCommand({
    Bucket: PROFILE_PICTURES_BUCKET,
    Key: key,
    Body: body,
  });

  // Upload the object using the S3Client
  await s3Client.send(uploadCommand);
}
