# gh-actions

## What

Reusable actions and workflows for Github Actions

The main export of this repo is the reusable workflow `.github/workflows/ci-cd-reusable.yml`. This provides a standardised CI/CD workflow for FVTT packages.

## Why

Ideally these would live in a [shared-fvtt-bits](https://github.com/n3dst4/shared-fvtt-bits) but because you can only reference reusable workflows from the `.github/workflows` folder of the same repo, OR from a public repo, it's hard to make changes on a branch and test they're right. Hence this repo, so I can make CI changes here that affect work being done on feature branches of other repos.

## How to use the reusable workflow

In your repo, create a new workflow file `.github/workflows/ci-cd.yml` that looks like this:

```yaml
name: CI/CD

on:
  - push
  - pull_request

jobs:
  # detects duplicate workflow runs
  pre_job:
    runs-on: ubuntu-latest
    outputs:
      should_skip: ${{ steps.skip_check.outputs.should_skip }}
    steps:
      - id: skip_check
        uses: fkirc/skip-duplicate-actions@v5.3.1
        with:
          concurrent_skipping: same_content_newer

  # main job
  ci-cd:
    needs: pre_job
    if: needs.pre_job.outputs.should_skip != 'true' || github.ref_type == 'tag'
    uses: lumphammer/gh-actions/.github/workflows/ci-cd-reusable.yml@XXXXX
    with:
      package_id: "xxx-xxx-xxx"
      manifest_file_name: "module.json"
      foundry_package_release: false
      release_to_bucket: false
```

Where `XXXXX` is the SHA or tag of the commit that you want to use and `xxx-xxx-xxx` is the ID of your FVTT package.


## Publishing to Foundry

If your package is published to Foundry, you can set `foundry_package_release` to `true` to have it auto-published when you push a new full release tag.

[About the Package Release API](https://foundryvtt.com/article/package-release-api/).

You will need to set the `FOUNDRY_PACKAGE_RELEASE_TOKEN` secret  in your workflow. You can get the token from the "Edit" page of your package on Foundry. Set it as a secret in your repo (**Settings** → **Secrets and variables** → **Actions** → **New repository secret**). Then pass it into the workflow like this:

```yaml
    secrets:
      FOUNDRY_PACKAGE_RELEASE_TOKEN: ${{ secrets.FOUNDRY_PACKAGE_RELEASE_TOKEN }}
```

(This goes directly below the `with` block.)


## Publishing to a DO bucket

The default behaviour is to publish to Github releases. This is adequate (and free!) for public packages, but doesn't work for private packages on account of nobody being able to use it.

For these, we can publish to a DigitalOcean Spaces bucket. This is like an S3 bucket, but on DO. You will need to ensure that the URLs in your package manifest are correct for DO:

```json
  "url": "whatever the URL is for the project",
  "manifest": "https://lumphammer-fvtt-packages.lon1.cdn.digitaloceanspaces.com/xxx-xxx-xxx/releases/latest/module.json",
  "download": "https://lumphammer-fvtt-packages.lon1.cdn.digitaloceanspaces.com/xxx-xxx-xxx/releases/latest/xxx-xxx-xxx.zip",
  "changelog": "https://lumphammer-fvtt-packages.lon1.cdn.digitaloceanspaces.com/xxx-xxx-xxx/releases/latest/CHANGELOG.md",
  "readme": "https://lumphammer-fvtt-packages.lon1.cdn.digitaloceanspaces.com/xxx-xxx-xxx/releases/latest/README.md",
  "bugs": "https://github.com/orgs/lumphammer/discussions",
  "media": [
    {
      "type": "cover",
      "url": "https://lumphammer-fvtt-packages.lon1.cdn.digitaloceanspaces.com/xxx-xxx-xxx/media/cover.webp"
    },
    {
      "type": "setup",
      "url": "https://lumphammer-fvtt-packages.lon1.cdn.digitaloceanspaces.com/xxx-xxx-xxx/media/cover.webp"
    }
  ]
```

At publish-time, the `download` URL will be set to the DO bucket URL.

If you want to publish to DO, you can set `release_to_bucket` to `true` and set the following secrets (as per setting the `FOUNDRY_PACKAGE_RELEASE_TOKEN` secret above):

* `DO_SECRET_KEY`
* `DO_ACCESS_KEY`

```yaml
    secrets:
      DO_SECRET_KEY: ${{ secrets.DO_SECRET_KEY }}
      DO_ACCESS_KEY: ${{ secrets.DO_ACCESS_KEY }}
```

You can get these from the DigitalOcean control panel (**APIs** → **Space Keys** → **Generate New Key**).


### Bucket folder structure

At the top level, the bucket has a folder for each FVTT package. Inside each of those folders, there is a `releases` folder and a `media` folder (plus, anything else you want to put in there).

Within `releases`, there are folders for each release version, plus a `latest` folder. Within each of those folders, there is a manifest file (aka `module.json` or `system.json`) and a zip file, which will always be called `xxx-xxx-xxx.zip` (where `xxx-xxx-xxx` is the ID of your FVTT package).

`latest` *also* contains a `CHANGELOG.md` and a `README.md` file, which are copied in from the Github repo. The `latest` folder always contains the most recent non-prerelease version.

```
swords-of-the-serpentine/
  media/
    wallpaper.webp
  releases/
    latest/
      CHANGELOG.md
      README.md
      module.json
      swords-of-the-serpentine.zip
    1.0.0/
      swords-of-the-serpentine.zip
      module.json
    1.0.1/
      swords-of-the-serpentine.zip
      module.json
    1.0.2-alpha.1/
      swords-of-the-serpentine.zip
      module.json
trebuchets-of-the-thames/
  media/
    ...etc...
  releases/
    latest/
      ...etc...
    1.0.0/
      ...etc...
halberds-of-the-hudson/
  ...etc...
nukes-of-the-nile/
mancatchers-of-the-miskatonic/
```


