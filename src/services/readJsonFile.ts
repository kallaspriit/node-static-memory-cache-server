import { readFile } from "fs";
import { promisify } from "util";

export interface IJson {
  [x: string]: string | number | IJson | IJson[] | undefined;
}

export default async function readJsonFile(filename: string): Promise<IJson> {
  return JSON.parse(await promisify(readFile)(filename, "utf8"));
}
