require("dotenv").config();
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs, { createWriteStream, unlinkSync } from "fs";
import { getTmpDir, createFile, removeFile } from "../utils/fileHandler";
import { Status } from "../utils/enums/status.enum";
import { Readable } from "node:stream";
import path from "node:path";
import { MultipartFile } from "@fastify/multipart";

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFIRE_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.CLOUDFIRE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFIRE_SECRET_ACCESS_KEY ?? "",
  },
});

type UploadFileResponse = {
  status: Status;
  uploadDir: string;
  fileUploadName: string;
};

export const uploadFile = async (
  file: MultipartFile
): Promise<UploadFileResponse> => {
  let result;
  let error;
  const { fileUploadName, uploadDir } = await createFile(file);
  try {
    const resultUpload = await S3.send(
      new PutObjectCommand({
        Bucket: "bucket-audio-techvideo",
        Key: fileUploadName,
        Body: fs.readFileSync(uploadDir),
        ContentType: file.mimetype,
      })
    );

    result = {
      status:
        resultUpload.$metadata.httpStatusCode == 200
          ? Status.SUCCESS
          : Status.ERROR,
      uploadDir,
      fileUploadName,
    };
  } catch (e) {
    error = {
      status: Status.ERROR,
      errorStack: e,
    };
  } finally {
    await removeFile(uploadDir);

    if (error) throw error;

    return result as UploadFileResponse;
  }
};

export const downloadFile = async (fileName: string) => {
  const uploadDir = path.resolve(await getTmpDir(), fileName);

  try {
    const downloadFile = await S3.send(
      new GetObjectCommand({
        Bucket: "bucket-audio-techvideo",
        Key: fileName,
      })
    );

    const setTmpFile = new Promise(async (resolve, reject) => {
      const body = downloadFile.Body;
      if (body instanceof Readable) {
        body
          .pipe(createWriteStream(uploadDir))
          .on("error", async (err) => {
            await removeFile(uploadDir);

            return reject({ errorStack: err, status: Status.ERROR });
          })
          .on("close", () => resolve({ status: Status.SUCCESS }));
      }
    });

    return await setTmpFile;
  } catch (error) {
    throw {
      status: Status.ERROR,
      errorStack: error,
    };
  }
};
