// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// IF YOU UPDATE THIS ACTION, CREATE A NEW TAG AND UPDATE THE REFERENCE IN THE
// CI/CD WORKFLOW
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import { getInput, info } from "@actions/core";
import archiver from "archiver";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

const manifestPath = getInput("manifest_path", {
  required: true,
});
const packagePath = getInput("package_path", {
  required: true,
});
const buildPath = getInput("build_path", {
  required: true,
});

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// Ensure there is a directory to hold all the packaged versions
fs.ensureDirSync(packagePath);
// Initialize the zip file
const zipName = process.env["ZIP_FILE_NAME"] ?? `${manifest.id}.zip`;
const zipFile = fs.createWriteStream(path.join(packagePath, zipName));
const zip = archiver("zip", { zlib: { level: 9 } });
zipFile.on("close", () => {
  info(chalk.green(zip.pointer() + " total bytes"));
  info(chalk.green(`Zip file ${zipName} has been written`));
});
// zip.on("error", reject);
zip.pipe(zipFile);
// Add the directory with the final code
zip.directory(buildPath, manifest.id);
await zip.finalize();

// .catch(reject);
