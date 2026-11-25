/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { promisify } from 'node:util';
import zlib from 'node:zlib';

import { encodeColumnarKeyMap } from '@lowdefy/errors';

const gzip = promisify(zlib.gzip);

// The gzipped error maps a production server reads to name an error's YAML
// file and line: keyMap.json.gz holds the key map in columns (a server keeps it
// for its lifetime, and a large app's key map parsed as plain JSON is a million
// objects), refMap.json.gz is refMap.json's text gzipped. Zlib's default level,
// and no timestamp in the header, so the same maps give the same bytes. The
// build writes them, and so do vercel-output and docker-output for a build that
// has none, so both write the same files. The gzips run on the threadpool.
async function compressBuildMaps({ keyMap, refMapText }) {
  const [keyMapGz, refMapGz] = await Promise.all([
    gzip(JSON.stringify(encodeColumnarKeyMap({ keyMap }))),
    gzip(refMapText),
  ]);
  return { keyMapGz, refMapGz };
}

export default compressBuildMaps;
