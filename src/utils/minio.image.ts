import * as Minio from "minio";
import env from "./env";
// Define port separately

const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: parseInt(env.MINIO_PORT),
  useSSL: false, // Set to true if using SSL
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export async function uploadFileToMiniIOS3(
  imageBuffer: Buffer,
  fileName: string,
): Promise<string | null> {
  try {
    const bucketName = env.MINIO_BUCKET_NAME;
    const bucketExists = await minioClient.bucketExists(
      bucketName ?? env.MINIO_BUCKET_NAME
    );

    console.log("imageBuffer-----> ", bucketExists);
    if (!bucketExists) {
      const finalBucketName = bucketName ?? env.MINIO_BUCKET_NAME;
      await minioClient.makeBucket(finalBucketName, "asia-east"); // Specify region

      // Set public access policy for the new bucket
      await minioClient.makeBucket(bucketName ?? env.MINIO_BUCKET_NAME, "asia-east"); // Specify region

    }


    console.log("imageBuffer-----> ", imageBuffer && Buffer.isBuffer(imageBuffer));
    // Upload the file
    if (imageBuffer && Buffer.isBuffer(imageBuffer)) {
      const stream = require("stream");
      const bufferStream = new stream.PassThrough();
      bufferStream.end(imageBuffer); // End the stream with the buffer

      // Upload the buffer stream to MinIO
      await minioClient.putObject(
        bucketName ?? env.MINIO_BUCKET_NAME,
        fileName,
        bufferStream,
        imageBuffer.length
      );
    } else {
      // If imageBuffer is a file path, use fPutObject
      await minioClient.fPutObject(
        bucketName ?? env.MINIO_BUCKET_NAME,
        fileName,
        imageBuffer
      );
    }
    console.log("imageBuffer-----> ", `${env.BASE_URL}/image/v1/${fileName}`);
    // Construct the public URL
    const downloadUrl = `${env.BASE_URL}/image/v1/${fileName}`;

    return downloadUrl; // Return the download URL
  } catch (error: any) {
    console.error("Error uploading file:", error.message);
    return null;
  }
}


// ✅ DigitalOcean Spaces connection (S3-compatible)
const digitalOceanClient = new Minio.Client({
  endPoint: "silvertaxi.blr1.digitaloceanspaces.com", // no https://
  useSSL: true, // Spaces requires SSL
  accessKey: env.DO_BUCKET_ACCESS_KEY, // from DO dashboard
  secretKey: env.DO_BUCKET_SECRET_KEY, // from DO dashboard
  region: "blr1",
});

// ✅ Upload function
export async function uploadFileToDOS3(
  imageBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  try {
    const bucketName = env.DO_BUCKET_NAME; // e.g. "silvertaxi"

    // ❌ Spaces does NOT allow creating buckets dynamically
    // So skip makeBucket() and bucketExists() checks entirely

    console.log("imageBuffer valid:", Buffer.isBuffer(imageBuffer));

    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error("Invalid image buffer");
    }

    const stream = new (require("stream").PassThrough)();
    stream.end(imageBuffer);

    // ✅ Upload the object directly
    await digitalOceanClient.putObject(bucketName, fileName, stream, imageBuffer.length, {
      "Content-Type": "application/octet-stream",
      "x-amz-acl": "public-read", // Make file publicly accessible
    });

    // ✅ Construct public URL
    const publicUrl = `https://${env.DO_BUCKET_ENDPOINT}/${env.DO_BUCKET_NAME}/${fileName}`;
    console.log("✅ Uploaded:", publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error("❌ Error uploading file:", error.message);
    return null;
  }
}