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

const JOURNEYS_DIRECTORY = path.join('tests', 'journeys');

function isJourneyFile(fileName) {
  return fileName.endsWith('.yaml') || fileName.endsWith('.yml');
}

function readJourneyFile({ filePath }) {
  let parsed;
  try {
    parsed = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [{ filePath, journey: undefined, error: `Invalid YAML: ${error.message}` }];
  }
  if (type.isArray(parsed)) {
    return parsed.map((journey) => ({ filePath, journey }));
  }
  return [{ filePath, journey: parsed }];
}

function discoverJourneys({ context }) {
  const directory = path.join(context.directories.config, JOURNEYS_DIRECTORY);
  if (!fs.existsSync(directory)) {
    return [];
  }
  const fileNames = fs
    .readdirSync(directory)
    .filter(isJourneyFile)
    .sort((a, b) => a.localeCompare(b));
  return fileNames.flatMap((fileName) =>
    readJourneyFile({ filePath: path.join(directory, fileName) })
  );
}

export default discoverJourneys;
