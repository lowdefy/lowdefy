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
  // `journeyIndex` is where the journey sits in a file holding a list of them,
  // and undefined in a file holding one - the address `lowdefy test --update`
  // writes a filled expectation back to.
  if (type.isArray(parsed)) {
    return parsed.map((journey, journeyIndex) => ({ filePath, journey, journeyIndex }));
  }
  // A file whose YAML parses to null is empty or fully commented out; saying so
  // is clearer than "Journey should be an object. Received null."
  if (type.isNone(parsed)) {
    return [{ filePath, journey: undefined, error: 'Journey file is empty.' }];
  }
  return [{ filePath, journey: parsed }];
}

function discoverJourneys({ context }) {
  const directory = path.join(context.directories.config, JOURNEYS_DIRECTORY);
  if (!fs.existsSync(directory)) {
    return [];
  }
  // D11: tests/journeys/_candidates holds what `lowdefy journeys compile` wrote
  // from a production trace. A candidate is a proposal with unfilled
  // expectations and no fixtures; promotion is moving the file up a directory.
  // Reading files only, and never a subdirectory, is what keeps it out.
  const fileNames = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isJourneyFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  return fileNames.flatMap((fileName) =>
    readJourneyFile({ filePath: path.join(directory, fileName) })
  );
}

export default discoverJourneys;
