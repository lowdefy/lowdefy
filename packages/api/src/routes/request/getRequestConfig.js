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

import { ConfigError } from '@lowdefy/errors';

async function getRequestConfig(
  { importConfigModule, logger, readConfigFile },
  { pageId, requestId }
) {
  const request = await readConfigFile(`pages/${pageId}/requests/${requestId}.json`);
  // S3a: compiled builds ship a closure module for the request properties —
  // when present it replaces the data form and the evaluator calls it.
  if (request && importConfigModule) {
    const closureModule = await importConfigModule(`pages/${pageId}/requests/${requestId}.mjs`);
    if (closureModule?.default) {
      request.properties = closureModule.default;
    }
  }
  if (!request) {
    const err = new ConfigError(`Request "${requestId}" does not exist.`);
    logger.debug({ params: { pageId, requestId }, err }, err.message);
    throw err;
  }
  return request;
}

export default getRequestConfig;
