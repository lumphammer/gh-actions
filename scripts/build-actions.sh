#!/bin/bash

# set -euo pipefail

inputs=$(find ./.github/actions -wholename "*/src/index.ts")

# e.g.
# ./.github/actions/update-manifest/src/index.ts
# ./.github/actions/validate-fvtt-package/src/index.ts

for input in $inputs; do
  src_dir=$(dirname $input)
  output_dir=$(dirname $src_dir)/dist
  echo -e "---\nInput file: ${input}\nOutput dir: ${output_dir}"
  # see https://github.com/evanw/esbuild/issues/1921#issuecomment-2302290651
  npx esbuild ${input} \
    --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
    --bundle \
    --format=esm \
    --target=node20 \
    --platform=node \
    --minify \
    --outdir=${output_dir}
done
