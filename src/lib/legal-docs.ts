import fs from "fs";
import path from "path";

export function getLegalMarkdown(filename: string): string {
  const filePath = path.join(process.cwd(), "docs", "legal", filename);
  return fs.readFileSync(filePath, "utf-8");
}
