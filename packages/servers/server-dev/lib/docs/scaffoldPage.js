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

import readBuildArtifact from './readBuildArtifact.js';

const pageIdPattern = /^[a-z0-9-_]+$/i;

function buildPageYaml({ pageId, title }) {
  const titleJson = JSON.stringify(title);
  return `id: ${pageId}
type: PageHeaderMenu
properties:
  title: ${titleJson}
blocks:
  - id: ${pageId}_title
    type: Title
    properties:
      content: ${titleJson}
`;
}

// Scaffolds a new page config file for an AI agent to wire up — it never edits lowdefy.yaml
// itself, since that would risk destroying the user's comments and formatting.
function scaffoldPage({ pageId, title }) {
  if (type.isNone(pageId) || !pageIdPattern.test(pageId)) {
    return {
      error: `Invalid page id ${JSON.stringify(
        pageId
      )}. Page ids may only contain letters, numbers, "-" and "_".`,
    };
  }

  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const pageRelativePath = path.join('pages', `${pageId}.yaml`);
  const pageFilePath = path.join(configDirectory, pageRelativePath);

  if (fs.existsSync(pageFilePath)) {
    return { error: `"${pageRelativePath}" already exists.` };
  }

  const pageRegistry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  if (Object.keys(pageRegistry).includes(pageId)) {
    return {
      error: `Page id "${pageId}" is already used by another page in the build (see build/pageRegistry.json). Choose a different id.`,
    };
  }

  const pageTitle = title ?? pageId;
  fs.mkdirSync(path.dirname(pageFilePath), { recursive: true });
  fs.writeFileSync(pageFilePath, buildPageYaml({ pageId, title: pageTitle }));

  return {
    created: pageRelativePath,
    next: `Add \`- _ref: ${pageRelativePath}\` under \`pages:\` in lowdefy.yaml (or the relevant pages file), then check lowdefy_build_status.`,
  };
}

export default scaffoldPage;
