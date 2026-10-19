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
import { type } from '@lowdefy/helpers';

import isJourneyFile from './isJourneyFile.js';
import listJourneyFiles from './listJourneyFiles.js';

const GLOB_CHARACTERS = /[*?[]/;

function isInside({ directory, filePath }) {
  const relative = path.relative(directory, filePath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

// A matched directory stands for every journey file under it; a matched file
// counts only when it is a journey file, so `review/*` skips a README.
function filesOfMatch(match) {
  if (fs.statSync(match).isDirectory()) {
    return listJourneyFiles({ directory: match });
  }
  return isJourneyFile(match) ? [match] : [];
}

// The CLI expands globs itself, not the shell, so a quoted glob, an npm script
// on Windows and the lowdefy_run_tests tool's paths all match the same files.
function expandGlob({ given, base, configDirectory }) {
  const matches = fs
    .globSync(given, { cwd: base })
    .map((match) => path.resolve(base, match))
    .sort((a, b) => a.localeCompare(b));
  if (matches.length === 0) {
    return { error: `Journey path "${given}" matches no files.` };
  }
  const outside = matches.find(
    (match) => !isInside({ directory: configDirectory, filePath: match })
  );
  if (!type.isUndefined(outside)) {
    return {
      error: `Journey path "${given}" matches ${outside}, outside the config directory ${configDirectory}.`,
    };
  }
  const files = matches.flatMap(filesOfMatch);
  if (files.length === 0) {
    return { error: `Journey path "${given}" matches no journey files.` };
  }
  return { files };
}

// The journey files the paths name, resolved against `base`: a file as it is,
// a directory as every journey file under it, and a glob (a path with *, ? or
// [, including **) as every journey file it matches. Any path under the config
// directory runs, candidates in tests/journeys/_candidates included; a path
// outside it, one that does not exist, or a glob that matches nothing is
// refused.
function resolveJourneyPaths({ paths, base, configDirectory }) {
  const directory = path.resolve(configDirectory);
  const files = [];
  for (const given of paths) {
    const resolved = path.resolve(base, given);
    if (!fs.existsSync(resolved) && GLOB_CHARACTERS.test(given)) {
      const expanded = expandGlob({ given, base, configDirectory: directory });
      if (expanded.error) {
        return { error: expanded.error };
      }
      files.push(...expanded.files);
      continue;
    }
    if (!isInside({ directory, filePath: resolved })) {
      return {
        error: `Journey path "${given}" is outside the config directory ${configDirectory}.`,
      };
    }
    if (!fs.existsSync(resolved)) {
      return { error: `Journey path "${given}" does not exist.` };
    }
    if (fs.statSync(resolved).isDirectory()) {
      files.push(...listJourneyFiles({ directory: resolved }));
    } else {
      files.push(resolved);
    }
  }
  return { files: [...new Set(files)] };
}

export default resolveJourneyPaths;
