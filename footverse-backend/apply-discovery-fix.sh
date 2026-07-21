#!/usr/bin/env bash
# Decodes the corrected cjCategoryService.js from base64 into place.
# Run from the backend root, with cjCategoryService.js.b64 in the same dir.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
B64="$HERE/cjCategoryService.js.b64"
[ -f "$B64" ] || { echo "✗ cjCategoryService.js.b64 not found next to this script"; exit 1; }
mkdir -p src/services
base64 -d "$B64" > src/services/cjCategoryService.js
node --check src/services/cjCategoryService.js && echo "✓ cjCategoryService.js applied and valid"
grep -q "parentMentionsShoes" src/services/cjCategoryService.js && echo "✓ discovery fix confirmed present"
