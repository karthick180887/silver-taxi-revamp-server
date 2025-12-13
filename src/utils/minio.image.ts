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
// Note: Client is created lazily to use environment variables
const getDigitalOceanClient = (): Minio.Client => {
  const endpoint = env.DO_BUCKET_ENDPOINT || "silvertaxi.blr1.digitaloceanspaces.com";
  // Remove https:// if present (MinIO client expects just the domain)
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  console.log(`[MinIO] Creating DO Spaces client with endpoint: ${cleanEndpoint}`);
  
  // Determine SSL setting - check if DO_BUCKET_SSL is set to "true" (string) or default to true for Spaces
  const useSSL = env.DO_BUCKET_SSL === "true" || env.DO_BUCKET_SSL === undefined ? true : false;
  
  return new Minio.Client({
    endPoint: cleanEndpoint,
    useSSL: useSSL, // Default to true for Spaces
    accessKey: env.DO_BUCKET_ACCESS_KEY,
    secretKey: env.DO_BUCKET_SECRET_KEY,
    region: "blr1", // Extract from endpoint or use default
  });
};

// ✅ Upload function
export async function uploadFileToDOS3(
  imageBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  try {
    // Use "silvertaxi" as the bucket name (the actual bucket)
    // Prepend "silver-taxi-images/" to the fileName to store in that folder
    const bucketName = "silvertaxi"; // Hardcoded to actual bucket name
    const folderPrefix = "silver-taxi-images/"; // Folder inside the bucket
    const fullFileName = `${folderPrefix}${fileName}`; // e.g. "silver-taxi-images/pan/QpaW4lLFqm.webp"
    
    const accessKey = env.DO_BUCKET_ACCESS_KEY;
    const secretKey = env.DO_BUCKET_SECRET_KEY;
    const endpoint = env.DO_BUCKET_ENDPOINT;

    // Validate environment variables
    if (!accessKey || !secretKey || !endpoint) {
      console.error("❌ Missing DigitalOcean Spaces configuration:");
      console.error("  - DO_BUCKET_ACCESS_KEY:", accessKey ? "✓" : "✗ MISSING");
      console.error("  - DO_BUCKET_SECRET_KEY:", secretKey ? "✓" : "✗ MISSING");
      console.error("  - DO_BUCKET_ENDPOINT:", endpoint ? "✓" : "✗ MISSING");
      throw new Error("DigitalOcean Spaces credentials are not configured. Please check your environment variables.");
    }

    // ❌ Spaces does NOT allow creating buckets dynamically
    // So skip makeBucket() and bucketExists() checks entirely

    console.log("imageBuffer valid:", Buffer.isBuffer(imageBuffer));
    console.log("DO Spaces config - Bucket:", bucketName, "Folder:", folderPrefix, "Endpoint:", endpoint);
    console.log("DO Spaces config - Full file path:", fullFileName);
    console.log("DO Spaces config - AccessKey present:", accessKey ? "Yes" : "No", "SecretKey present:", secretKey ? "Yes" : "No");

    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error("Invalid image buffer");
    }
    
    // Verify credentials format (basic check)
    if (accessKey && accessKey.length < 10) {
      console.warn("⚠️ DO_BUCKET_ACCESS_KEY seems too short. Expected format: long alphanumeric string");
    }
    if (secretKey && secretKey.length < 10) {
      console.warn("⚠️ DO_BUCKET_SECRET_KEY seems too short. Expected format: long alphanumeric string");
    }

    const stream = new (require("stream").PassThrough)();
    stream.end(imageBuffer);

    // Determine Content-Type based on file extension
    const getContentType = (fileName: string): string => {
      const ext = fileName.toLowerCase().split('.').pop();
      const contentTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
      };
      return contentTypes[ext || ''] || 'image/jpeg';
    };

    const contentType = getContentType(fileName);
    console.log(`Uploading with Content-Type: ${contentType}, fileName: ${fullFileName}, size: ${imageBuffer.length} bytes`);

    // Create client with current environment variables
    const digitalOceanClient = getDigitalOceanClient();

    // ✅ Upload the object directly (using fullFileName which includes folder prefix)
    await digitalOceanClient.putObject(bucketName, fullFileName, stream, imageBuffer.length, {
      "Content-Type": contentType,
      "x-amz-acl": "public-read", // Make file publicly accessible
    });

    // ✅ Construct public URL
    // For DigitalOcean Spaces, the URL format is: https://{endpoint}/{folder}/{file}
    // The bucket name is already part of the endpoint domain, so don't include it in the path
    const baseUrl = env.DO_BUCKET_BASE_URL || `https://${endpoint}`;
    // fullFileName already includes the folder prefix (silver-taxi-images/...)
    // So the URL should be: https://silvertaxi.blr1.digitaloceanspaces.com/silver-taxi-images/pan/...
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/${fullFileName}`;
    console.log("✅ Uploaded:", publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error("❌ Error uploading file:");
    console.error("  - Error message:", error?.message || 'No message');
    console.error("  - Error code:", error?.code || 'No code');
    console.error("  - Error name:", error?.name || 'No name');
    console.error("  - Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error("  - Stack:", error?.stack || 'No stack');
    return null;
  }
}