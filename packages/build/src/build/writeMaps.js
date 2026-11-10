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
import { promisify } from 'util';
import zlib from 'zlib';

import { encodeColumnarKeyMap } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';

const gzip = promisify(zlib.gzip);

// Refs are added to refMap as they resolve, in parallel, so its insertion order
// follows I/O timing. Sorting the ids writes the same file for the same config.
function sortRefMap(refMap) {
  const sorted = {};
  for (const id of Object.keys(refMap).sort()) {
    sorted[id] = refMap[id];
  }
  return sorted;
}

async function writeMaps({ context }) {
  if (!type.isObject(context.keyMap)) {
    throw new Error('keyMap is not an object.');
  }
  if (!type.isObject(context.refMap)) {
    throw new Error('refMap is not an object.');
  }
  const keyMapString = serializer.serializeToString(context.keyMap);
  const refMapString = serializer.serializeToString(sortRefMap(context.refMap));
  const writes = [
    context.writeBuildArtifact('keyMap.json', keyMapString),
    context.writeBuildArtifact('refMap.json', refMapString),
  ];
  // Production servers ship the gzipped maps (vercel-output, docker-output) and
  // read them on their first error log. The plain files stay for build-folder
  // readers like lowdefy journeys. The gzipped key map holds the key map in
  // columns: a server keeps it for its lifetime, and a large app's key map
  // parsed as plain JSON is a million objects. The gzips run on the threadpool,
  // alongside the plain writes.
  if (context.writeCompressedMaps === true) {
    writes.push(
      gzip(JSON.stringify(encodeColumnarKeyMap({ keyMap: context.keyMap }))).then((compressed) =>
        context.writeBuildArtifact('keyMap.json.gz', compressed)
      ),
      gzip(refMapString).then((compressed) =>
        context.writeBuildArtifact('refMap.json.gz', compressed)
      )
    );
  }
  await Promise.all(writes);
}

export default writeMaps;
