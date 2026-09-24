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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import authPageRoles from './buildAuth/authPageRoles.js';

const allowedKeys = ['hooks', 'pages', 'public'];

function contentKeys(object) {
  return Object.keys(object).filter((key) => !key.startsWith('~'));
}

// Validates the shape of a module manifest's auth section. Ids are unscoped
// module-local ids here - buildModuleAuth resolves them to scoped ids per
// module entry, and the merged result is validated again by buildAuth
// (hook points, endpoint existence and type) exactly as hand-written config.
function validateModuleAuthManifest({ auth, entryId, filePath }) {
  if (type.isNone(auth)) {
    return;
  }
  if (!type.isObject(auth)) {
    throw new ConfigError(`Module "${entryId}" manifest "auth" must be an object.`, {
      received: auth,
      filePath,
    });
  }
  for (const key of contentKeys(auth)) {
    if (!allowedKeys.includes(key)) {
      throw new ConfigError(
        `Module "${entryId}" manifest "auth" has unknown key "${key}". Allowed keys are: ${allowedKeys.join(
          ', '
        )}.`,
        { filePath }
      );
    }
  }

  if (!type.isNone(auth.hooks)) {
    if (!type.isArray(auth.hooks)) {
      throw new ConfigError(`Module "${entryId}" manifest "auth.hooks" must be an array.`, {
        received: auth.hooks,
        filePath,
      });
    }
    for (const hook of auth.hooks) {
      if (!type.isObject(hook) || !type.isString(hook.point) || !type.isString(hook.endpoint)) {
        throw new ConfigError(
          `Module "${entryId}" manifest "auth.hooks" entries must be objects with string "point" and "endpoint" properties.`,
          { received: hook, filePath }
        );
      }
      for (const key of contentKeys(hook)) {
        if (key !== 'point' && key !== 'endpoint') {
          throw new ConfigError(
            `Module "${entryId}" manifest "auth.hooks" entry has unknown key "${key}". Allowed keys are: point, endpoint.`,
            { filePath }
          );
        }
      }
    }
  }

  if (!type.isNone(auth.pages)) {
    if (!type.isObject(auth.pages)) {
      throw new ConfigError(`Module "${entryId}" manifest "auth.pages" must be an object.`, {
        received: auth.pages,
        filePath,
      });
    }
    for (const role of contentKeys(auth.pages)) {
      if (!authPageRoles.includes(role)) {
        throw new ConfigError(
          `Module "${entryId}" manifest "auth.pages" has unknown role "${role}". Valid roles are: ${authPageRoles.join(
            ', '
          )}.`,
          { filePath }
        );
      }
      if (!type.isString(auth.pages[role])) {
        throw new ConfigError(
          `Module "${entryId}" manifest "auth.pages.${role}" must be a page id string.`,
          { received: auth.pages[role], filePath }
        );
      }
    }
  }

  if (!type.isNone(auth.public)) {
    if (!type.isArray(auth.public)) {
      throw new ConfigError(
        `Module "${entryId}" manifest "auth.public" must be an array of page ids.`,
        { received: auth.public, filePath }
      );
    }
    for (const pageId of auth.public) {
      if (!type.isString(pageId)) {
        throw new ConfigError(
          `Module "${entryId}" manifest "auth.public" entries must be page id strings.`,
          { received: pageId, filePath }
        );
      }
    }
  }
}

export default validateModuleAuthManifest;
