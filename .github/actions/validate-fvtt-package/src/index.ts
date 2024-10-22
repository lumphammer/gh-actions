// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// IF YOU UPDATE THIS ACTION, CREATE A NEW TAG AND UPDATE THE REFERENCE IN THE
// CI/CD WORKFLOW
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import { getInput } from "@actions/core";
import fs from "fs";

import {
  checkUrl,
  isNonEmptyString,
  isTruthyString,
} from "../../../src/helpers";

// /////////////////////////////////////////////////////////////////////////////
// fetch inputs
const fvttManifestPath = getInput("manifest_path", {
  required: true,
});
const strictMode = isTruthyString(getInput("strict_mode", { required: true }));
const releaseToBucket = isTruthyString(
  getInput("release_to_bucket", { required: true }),
);
const tag = getInput("tag", { required: true });
// const doSpaceName = getInput("do_space_name", { required: true });
// const doSpaceRegion = getInput("do_space_region", { required: true });

// /////////////////////////////////////////////////////////////////////////////
// parse manifests as JSON
const fvttManifest = JSON.parse(fs.readFileSync(fvttManifestPath, "utf8"));
const nodeManifest = JSON.parse(fs.readFileSync("package.json", "utf8"));

// list of errors to return
const errors: string[] = [];

// /////////////////////////////////////////////////////////////////////////////
// package name
if (nodeManifest.name !== `${fvttManifest.id}-fvtt`) {
  errors.push(
    `Package ID/name mismatch: FVTT manifest at ${fvttManifestPath} ID (${fvttManifest.id}) does not match package.json name without "-fvtt" suffix (${nodeManifest.name})`,
  );
}

// /////////////////////////////////////////////////////////////////////////////
// version match between manifests and tag (if pushing a tag)
if (fvttManifest.version !== nodeManifest.version) {
  errors.push(
    `Version mismatch: FVTT manifest at ${fvttManifestPath} version (${fvttManifest.version}) does not match package.json version (${nodeManifest.version})`,
  );
}

if (isNonEmptyString(tag)) {
  if (`v${fvttManifest.version}` !== tag) {
    errors.push(
      `Tag mismatch: FVTT manifest at ${fvttManifestPath} version (${fvttManifest.version}) does not match tag (${tag})`,
    );
  }
  if (`v${nodeManifest.version}` !== tag) {
    errors.push(
      `Tag mismatch: package.json version (${nodeManifest.version}) does not match tag (${tag})`,
    );
  }
}

// /////////////////////////////////////////////////////////////////////////////
// basic checks on all URLS
const urlKeys = ["url", "manifest", "download", "changelog", "readme", "bugs"];
for (const key of urlKeys) {
  const url = fvttManifest[key];
  const urlError = await checkUrl(url, strictMode);
  if (urlError) {
    errors.push(`${fvttManifestPath}: \`${key}\` (${url}): ${urlError}`);
  }
}

// /////////////////////////////////////////////////////////////////////////////
// media
if (!Array.isArray(fvttManifest.media)) {
  errors.push(`${fvttManifestPath}: media is not an array`);
}

const mediaTypes = ["cover", "setup"];

for (const mediaType of mediaTypes) {
  const media = fvttManifest.media.find((m: any) => m.type === mediaType);
  if (!media) {
    errors.push(`Foundry manifest: media does not contain a ${mediaType}`);
  }
  const mediaError = await checkUrl(media.url, strictMode);
  if (mediaError) {
    errors.push(
      `${fvttManifestPath}: ${mediaType} media URL (${media.url}): ${mediaError}`,
    );
  }
}

// /////////////////////////////////////////////////////////////////////////////
// check that manifest and download URLs are correct for DO bucket
if (releaseToBucket) {
  const downloadUrl = fvttManifest.download;
  const downloadError = await checkUrl(downloadUrl, strictMode);
  if (downloadError) {
    errors.push(
      `${fvttManifestPath}: download URL (${downloadUrl}): ${downloadError}`,
    );
  }
}
