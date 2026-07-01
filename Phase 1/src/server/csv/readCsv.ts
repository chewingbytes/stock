import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

export async function readCsv<T extends Record<string, string>>(
  path: string,
): Promise<T[]> {
  const content = await readFile(path, "utf8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}
