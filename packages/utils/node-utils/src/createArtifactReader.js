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

import fs from 'node:fs';
import path from 'node:path';

import { serializer } from '@lowdefy/helpers';

import deepFreeze from './deepFreeze.js';

// A file modified this close to when it was read may be rewritten within the same timestamp tick,
// keeping its modified time: ext4 stamps files with a clock that moves a few milliseconds at a
// time, HFS+ and ext3 a second, FAT two seconds.
const RACY_WINDOW_MS = 2000;

function isSameFile(kept, stat) {
  return (
    kept.ino === stat.ino &&
    kept.size === stat.size &&
    kept.mtimeNs === stat.mtimeNs &&
    kept.ctimeNs === stat.ctimeNs
  );
}

// Reads build artifacts from buildDirectory by their path in the build ("pages/home.json"): the
// parsed JSON, deserialized with the serializer unless deserialize is false, or null when the
// build has no such file. Each file is parsed once and its value kept while the file stays as it
// was read: same inode, size, and modified and changed times (stat taken before the read). A build
// that rewrites a file, as the dev server's on-demand page builds do, is read again with no
// invalidation code. A file read within RACY_WINDOW_MS of its modified time could be rewritten
// with all four unchanged, so its text is kept too and compared on the next read until a read
// lands outside the window. A missing file costs one stat. A file that fails to parse (one the
// build is still writing) throws and is not kept.
//
// The values are shared by every caller and frozen: a reader must not change one.
function createArtifactReader({ buildDirectory, deserialize = true }) {
  const kept = new Map();

  function parse(text) {
    const json = JSON.parse(text);
    return deepFreeze(deserialize ? serializer.deserialize(json) : json);
  }

  function keep({ name, readAt, stat, text, value }) {
    const racy = readAt - Number(stat.mtimeNs / 1000000n) < RACY_WINDOW_MS;
    kept.set(name, { stat, text: racy ? text : null, value });
    return value;
  }

  return function readArtifact(name) {
    const filePath = path.join(buildDirectory, name);
    const readAt = Date.now();
    const stat = fs.statSync(filePath, { bigint: true, throwIfNoEntry: false });
    if (stat === undefined) {
      kept.delete(name);
      return null;
    }
    const entry = kept.get(name);
    if (entry !== undefined && isSameFile(entry.stat, stat) && entry.text === null) {
      return entry.value;
    }
    const text = fs.readFileSync(filePath, 'utf8');
    if (entry !== undefined && isSameFile(entry.stat, stat) && entry.text === text) {
      return keep({ name, readAt, stat, text, value: entry.value });
    }
    return keep({ name, readAt, stat, text, value: parse(text) });
  };
}

export default createArtifactReader;
