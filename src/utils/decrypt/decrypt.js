import * as crypto from "crypto";
//import * as fs from "fs";

/**
 * 暗号化キーを複合化する処理
 */
export function decryptGCPServiceAccount() {
  const algorithm = "aes-256-cbc";
  // 環境変数から読み込む
  const key = process.env.DECRYPT_KEY
  const iv = process.env.DECRYPT_IV
  const source = process.env.ENCRYPTED_KEY

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );
  const data = Buffer.from(source, "base64").slice(16);
  const start = decipher.update(data);
  const final = decipher.final();
  const result = Buffer.concat([start, final]).toString("utf8");

  // 複合化されたサービスアカウントのJson
  return JSON.parse(result);
}