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

import isAuthConfigured from './buildAuth/isAuthConfigured.js';

// Contributes module-manifest auth wiring into the app's auth config with
// scoped ids, so buildAuth validates the merged result exactly as
// hand-written config. Merge semantics per key:
// - auth.hooks: ordered union. Module bindings are placed BEFORE the app's
//   entries, in module-entry declaration order - the runtime composes hooks
//   in array order (engine hooks first), so this array ordering IS the tier
//   order: engine -> module contributions -> app entries.
// - authPages: app wins per role; two modules claiming the same role with no
//   app override is a build error.
// - pages.public: union. Contributed entries behave as hand-written public
//   exceptions - they join an app public list, are no-ops under public: true,
//   and never join a protected list (buildEntityAuth keeps them public via
//   context.moduleAuthPublicPages in the protected modes).
function buildModuleAuth({ components, context, moduleEntries }) {
  const contributingModules = moduleEntries
    .map((entry) => context.modules[entry.id])
    .filter((moduleEntry) => !type.isNone(moduleEntry?.manifest?.auth));

  if (contributingModules.length === 0) {
    return components;
  }

  // Module auth wiring configures the app's auth setup - without an app auth
  // block there is no auth to wire, so contributions are inert.
  if (!isAuthConfigured({ components })) {
    return components;
  }

  const contributedHooks = [];
  const roleClaims = {};
  context.moduleAuthPublicPages = context.moduleAuthPublicPages ?? [];

  // Snapshot the roles the app sets before any module contributes, so a
  // module's contribution is not mistaken for an app override.
  const appSetRoles = new Set(
    Object.keys(components.auth.authPages ?? {}).filter(
      (role) => !role.startsWith('~') && !type.isNone(components.auth.authPages[role])
    )
  );

  for (const moduleEntry of contributingModules) {
    const entryId = moduleEntry.id;
    const auth = moduleEntry.manifest.auth;

    for (const hook of auth.hooks ?? []) {
      const endpointId = `${entryId}/${hook.endpoint}`;
      const binding = {
        id: `${endpointId}:${hook.point}`,
        point: hook.point,
        endpointId,
      };
      contributedHooks.push(binding);
      context.logger.info(
        `Module "${entryId}" contributed auth hook "${binding.id}" to "auth.hooks" binding point "${hook.point}" to endpoint "${endpointId}".`
      );
    }

    for (const [role, pageId] of Object.entries(auth.pages ?? {})) {
      if (role.startsWith('~')) {
        continue;
      }
      // App wins per role - an existing app value is kept.
      if (appSetRoles.has(role)) {
        continue;
      }
      if (!type.isNone(roleClaims[role])) {
        throw new ConfigError(
          `Modules "${roleClaims[role]}" and "${entryId}" both claim authPages role "${role}" and the app does not set it. Set "auth.authPages.${role}" in the app to choose one.`,
          { configKey: components.auth.authPages?.['~k'] ?? components.auth['~k'] }
        );
      }
      roleClaims[role] = entryId;
      const pagePath = `/${entryId}/${pageId}`;
      components.auth.authPages = components.auth.authPages ?? {};
      components.auth.authPages[role] = pagePath;
      context.logger.info(
        `Module "${entryId}" contributed "${pagePath}" to "auth.authPages.${role}".`
      );
    }

    for (const pageId of auth.public ?? []) {
      const scopedId = `${entryId}/${pageId}`;
      if (!context.moduleAuthPublicPages.includes(scopedId)) {
        context.moduleAuthPublicPages.push(scopedId);
      }
      if (
        type.isArray(components.auth.pages?.public) &&
        !components.auth.pages.public.includes(scopedId)
      ) {
        components.auth.pages.public.push(scopedId);
      }
      context.logger.info(
        `Module "${entryId}" contributed public page "${scopedId}" to "auth.pages.public".`
      );
    }
  }

  if (contributedHooks.length > 0) {
    components.auth.hooks = [...contributedHooks, ...(components.auth.hooks ?? [])];
  }

  return components;
}

export default buildModuleAuth;
