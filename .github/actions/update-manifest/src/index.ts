import fs from "fs-extra";

import { getInput, info } from "@actions/core";
import { context } from "@actions/github";

const manifestPath = getInput("manifest_path", {
  required: true,
});
const releaseToBucket = getInput("release_to_bucket", { required: true });
const tag = getInput("tag", { required: true });

const doSpaceName = getInput("do_space_name", { required: true });
const doSpaceRegion = getInput("do_space_region", { required: true });

const manifest = fs.readJSONSync(manifestPath);
const { id, version } = manifest;
const { owner, repo } = context.repo;

if (tag !== `v${version}`) {
  throw new Error(`Manifest version (v${version}) does not match tag (${tag})`);
}

let download = manifest.download;

if (["true", "1", "yes"].includes(releaseToBucket)) {
  download = `https://${doSpaceName}.${doSpaceRegion}.digitaloceanspaces.com/${id}/releases/${tag}/${id}.zip`;
} else {
  download = `https://github.com/${owner}/${repo}/releases/download/${tag}/${id}.zip`;
}

info(`Download URL: ${download}`);

manifest.download = download;

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
