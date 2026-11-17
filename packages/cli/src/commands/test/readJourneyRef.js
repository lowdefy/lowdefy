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

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

const EXTENSIONS = ['.yaml', '.yml', '.json'];

// The path of a `_ref` in its plain forms, `_ref: <path>` or `_ref: { path }`. Journey files are
// read as written, so vars, key, resolvers and transformers, which build runs code or templates
// for, are refused rather than ignored.
function readRefPath({ refDefinition }) {
  if (type.isString(refDefinition)) {
    return refDefinition;
  }
  const received = JSON.stringify({ _ref: refDefinition });
  if (!type.isObject(refDefinition) || !type.isString(refDefinition.path)) {
    throw new Error(
      `_ref in a journey file takes a path, as "_ref: <path>" or "_ref: { path }". Received ${received}.`
    );
  }
  const extra = Object.keys(refDefinition).filter((key) => key !== 'path');
  if (extra.length > 0) {
    throw new Error(
      `_ref "${refDefinition.path}" in a journey file takes only a path, not ${extra
        .map((key) => `"${key}"`)
        .join(', ')}: journey files are read as written. Received ${received}.`
    );
  }
  return refDefinition.path;
}

// The content of the file one `_ref` in a journey file names, parsed but with its own refs not
// yet resolved. Paths are from the config root, as in the rest of the app. `chain` holds the
// absolute paths of the journey file and every file referred to on the way here, so a file that
// refers back to one of them is a loop.
function readJourneyRef({ refDefinition, configDirectory, chain }) {
  const refPath = readRefPath({ refDefinition });
  const extension = path.extname(refPath).toLowerCase();
  if (!EXTENSIONS.includes(extension)) {
    throw new Error(
      `_ref "${refPath}": a journey file refers only to .yaml, .yml or .json files, read as written.`
    );
  }
  const absolutePath = path.resolve(configDirectory, refPath);
  if (chain.includes(absolutePath)) {
    const loop = [...chain, absolutePath].map((filePath) =>
      path.relative(configDirectory, filePath).split(path.sep).join('/')
    );
    throw new Error(`_ref "${refPath}" makes a loop: ${loop.join(' -> ')}.`);
  }
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `_ref "${refPath}": no file at ${absolutePath}. Paths in _ref are from the config root.`
    );
  }
  const text = fs.readFileSync(absolutePath, 'utf8');
  try {
    const content = extension === '.json' ? JSON.parse(text) : YAML.parse(text);
    return { content, absolutePath };
  } catch (error) {
    throw new Error(`_ref "${refPath}" does not parse: ${error.message}`, { cause: error });
  }
}

export default readJourneyRef;
