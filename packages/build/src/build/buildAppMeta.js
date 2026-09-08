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

import { execSync } from 'child_process';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';
import { evaluateOperators } from '@lowdefy/operators';
import operators from '@lowdefy/operators-js/operators/build';

import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import collectExceptions from '../utils/collectExceptions.js';
import getRefContent from './buildRefs/getRefContent.js';

const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

const ROOT_METADATA_FILE = 'lowdefy.yaml';

function computeGitSha() {
  const fromEnv = process.env.LOWDEFY_GIT_SHA?.trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (_) {
    return null;
  }
}

// Returns the single operator key of value (a non-tilde key starting with '_'),
// or null when value is not a single-operator object.
function operatorKey(value) {
  if (!type.isObject(value)) return null;
  const keys = Object.keys(value).filter((key) => !key.startsWith('~'));
  if (keys.length !== 1) return null;
  return keys[0].startsWith('_') ? keys[0] : null;
}

function collectFieldError(context, message, lineNumber) {
  const error = new ConfigError(message);
  error.filePath = ROOT_METADATA_FILE;
  if (!type.isNone(lineNumber)) {
    error.lineNumber = lineNumber;
  }
  collectExceptions(context, error);
}

// Resolve a single root metadata scalar. Root metadata must be final before the
// walker runs (it is what _app / _build.app read), so it can only depend on
// values available now: literals and _build.* operators. _ref/_var/static-_
// operators resolve later in buildRefs — deriving metadata from them is circular.
function resolveField({ context, field, value }) {
  if (type.isNone(value)) return null;

  // _build.app in root metadata is self-referential: app metadata cannot read
  // itself. Caught explicitly so every field reports clearly, not only `slug`.
  // Only the top-level form is special-cased; a _build.app nested deeper (e.g.
  // inside _build.string.concat) resolves against an undefined lowdefyApp —
  // yielding null for non-slug fields, or the "slug required" throw for slug.
  if (operatorKey(value) === '_build.app') {
    collectFieldError(
      context,
      `Root metadata field \`${field}\` cannot use \`_build.app\` — app metadata cannot reference itself.`,
      value['~l']
    );
    return null;
  }

  const { output, errors } = evaluateOperators({
    input: value,
    operators,
    operatorPrefix: '_build.',
    env: process.env,
    dynamicIdentifiers,
  });

  if (errors.length > 0) {
    errors.forEach((error) => {
      error.filePath = ROOT_METADATA_FILE;
      collectExceptions(context, error);
    });
    return null;
  }

  if (operatorKey(output)) {
    collectFieldError(
      context,
      `Root metadata field \`${field}\` must be a literal or a \`_build.*\` operator; \`_ref\`/\`_var\`/\`_*\` operators are not supported here.`,
      value['~l']
    );
    return null;
  }

  return output ?? null;
}

async function buildAppMeta({ context }) {
  const content =
    (await getRefContent({
      context,
      refDef: { path: ROOT_METADATA_FILE },
      referencedFrom: null,
    })) ?? {};

  context.appMeta = {
    slug: resolveField({ context, field: 'slug', value: content.slug }),
    name: resolveField({ context, field: 'name', value: content.name }),
    version: resolveField({ context, field: 'version', value: content.version }),
    description: resolveField({ context, field: 'description', value: content.description }),
    license: resolveField({ context, field: 'license', value: content.license }),
    lowdefyVersion: resolveField({ context, field: 'lowdefy', value: content.lowdefy }),
    gitSha: computeGitSha(),
  };

  return context.appMeta;
}

export default buildAppMeta;
