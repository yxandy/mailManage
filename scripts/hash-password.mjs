import { randomBytes, scryptSync } from "node:crypto";

const plainText = process.argv[2];

if (!plainText) {
  console.error("请传入需要生成哈希的密码，例如：node scripts/hash-password.mjs Admin123456");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const passwordHash = scryptSync(plainText, salt, 64).toString("hex");

console.log(`${salt}:${passwordHash}`);
