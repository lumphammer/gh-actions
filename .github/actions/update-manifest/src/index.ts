// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// IF YOU UPDATE THIS ACTION, CREATE A NEW TAG AND UPDATE THE REFERENCE IN THE
// CI/CD WORKFLOW
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import fs from "fs";
import { getInput, info } from "@actions/core";
import { context } from "@actions/github";

// fetch inputs
const manifestPath = getInput("manifest_path", {
  required: true,
});
const releaseToBucket = getInput("release_to_bucket", { required: true });
const tag = getInput("tag", { required: true });

const doSpaceName = getInput("do_space_name", { required: true });
const doSpaceRegion = getInput("do_space_region", { required: true });

// parse manifest as JSON
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const { id, version } = manifest;
const { owner, repo } = context.repo;

// sanity check
if (tag !== `v${version}`) {
  throw new Error(`Manifest version (v${version}) does not match tag (${tag})`);
}

if (["true", "1", "yes", "y", "t"].includes(releaseToBucket.toLowerCase())) {
  manifest.download = `https://${doSpaceName}.${doSpaceRegion}.digitaloceanspaces.com/${id}/releases/${tag}/${id}.zip`;
} else {
  manifest.download = `https://github.com/${owner}/${repo}/releases/download/${tag}/${id}.zip`;
}

info(`Download URL: ${manifest.download}`);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
