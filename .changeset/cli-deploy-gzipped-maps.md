---
'lowdefy': patch
---

fix(cli): Deploy output ships only the gzipped error maps

`lowdefy vercel-output` and `lowdefy docker-output` now copy the build folder without `keyMap.json` and `refMap.json`, and ship `keyMap.json.gz` and `refMap.json.gz`, which the production server reads to name the YAML file and line of an error. On a large app the plain maps could push the Vercel function past its 250 MB limit. A deploy script that deletes the plain maps (`find .vercel/output/functions -type f \( -name keyMap.json -o -name refMap.json \) -delete`) no longer needs to, and does no harm if left in: it matches only the plain names, so error locations are kept.
