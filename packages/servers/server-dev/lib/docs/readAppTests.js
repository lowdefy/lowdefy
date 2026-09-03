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
import YAML from 'yaml';
import { getJourneyTouches } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

// The same locations `lowdefy test` discovers from
// (packages/cli/src/commands/test/discoverJourneys.js and
// discoverRequestTests.js), plus the page -> journeys index a
// `lowdefy test --coverage` run writes.
const JOURNEYS_DIRECTORY = path.join('tests', 'journeys');
const REQUEST_TESTS_DIRECTORY = path.join('tests', 'requests');
const JOURNEY_INDEX_PATH = path.join('.lowdefy', 'test', 'journeyIndex.json');

function readYamlDocuments({ configDirectory, relativeDirectory, isTestFile, unreadable }) {
  const directory = path.resolve(configDirectory, relativeDirectory);
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory)
    .filter(isTestFile)
    .sort((a, b) => a.localeCompare(b))
    .flatMap((fileName) => {
      const filePath = path.join(directory, fileName);
      const file = path.join(relativeDirectory, fileName);
      let parsed;
      try {
        parsed = YAML.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        unreadable.push({ file, reason: `Invalid YAML: ${error.message}` });
        return [];
      }
      if (type.isArray(parsed)) {
        return parsed.map((document) => ({ file, document }));
      }
      if (type.isNone(parsed)) {
        unreadable.push({ file, reason: 'File is empty.' });
        return [];
      }
      return [{ file, document: parsed }];
    });
}

function isJourneyFile(fileName) {
  return fileName.endsWith('.yaml') || fileName.endsWith('.yml');
}

function isRequestTestFile(fileName) {
  return fileName.endsWith('.test.yaml') || fileName.endsWith('.test.yml');
}

function readJourneyIndex({ configDirectory }) {
  const filePath = path.resolve(configDirectory, JOURNEY_INDEX_PATH);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// The committed tests as the brief needs them: each journey with the
// (pageId, blockId, event) triples and request ids it exercises, each request
// test with the target it names. A file that will not parse is named under
// `unreadable` rather than counted as no tests.
function readAppTests({ configDirectory }) {
  const unreadable = [];
  const journeys = readYamlDocuments({
    configDirectory,
    relativeDirectory: JOURNEYS_DIRECTORY,
    isTestFile: isJourneyFile,
    unreadable,
  })
    .filter(({ document }) => type.isObject(document))
    .map(({ file, document }) => {
      const { pageId, requestIds, touches } = getJourneyTouches({ journey: document });
      return {
        name: type.isString(document.name) ? document.name : pageId,
        file,
        pageId,
        requestIds,
        touches,
      };
    });

  const requestTests = readYamlDocuments({
    configDirectory,
    relativeDirectory: REQUEST_TESTS_DIRECTORY,
    isTestFile: isRequestTestFile,
    unreadable,
  })
    .filter(({ document }) => type.isObject(document))
    .map(({ file, document }) => ({
      name: type.isString(document.name) ? document.name : null,
      file,
      pageId: type.isString(document.pageId) ? document.pageId : null,
      requestId: type.isString(document.requestId) ? document.requestId : null,
      endpointId: type.isString(document.endpointId) ? document.endpointId : null,
    }));

  return {
    journeys,
    requestTests,
    journeyIndex: readJourneyIndex({ configDirectory }),
    unreadable,
  };
}

export default readAppTests;
