import * as path from "path";
import readJsonFile, { IJson } from "./readJsonFile";

export interface IStringMap {
  [x: string]: string;
}

export interface IPackageInfo extends IJson {
  name: string;
  version: string;
  description: string;
  licence: string;
  author: string;
  scripts: IStringMap;
  dependencies: IStringMap;
  devDependencies: IStringMap;
  [x: string]: string | IStringMap;
}

export default async function getPackageInfo(
  filename: string = path.join(__dirname, "..", "..", "package.json"),
): Promise<IPackageInfo> {
  const result = await readJsonFile(filename);

  return result as IPackageInfo;
}
