import { randomUUID } from "node:crypto";
import { extname, basename, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { unlinkSync, createWriteStream, existsSync, PathLike } from "node:fs";
import { MultipartFile } from "@fastify/multipart";

export const getTmpDir = async () => {
  let tmpDir = "/tmp";
  if (!existsSync(tmpDir)) {
    tmpDir = resolve(__dirname, "../../tmp");
  }

  return tmpDir;
};

export const createFile = async (data: MultipartFile) => {
  const extension = extname(data.filename);

  const filebaseName = basename(data.filename, extname(data.filename));

  const fileUploadName = `${filebaseName}-${randomUUID()}${extension}`;

  const uploadDir = resolve(await getTmpDir(), fileUploadName);

  await pipeline(data.file, createWriteStream(uploadDir));

  return {
    fileUploadName,
    uploadDir,
  };
};

export const removeFile = async (dir: PathLike) => {
  unlinkSync(dir);
};
