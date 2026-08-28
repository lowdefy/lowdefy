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

import path from 'path';
import { type } from '@lowdefy/helpers';

// extractErrorProps emits a nested error as a plain props object, not as a second
// '~e' wrapper, so an error node is recognised by its shape. Keying on the shape
// rather than on a map of where errors can appear is deliberate: re-deriving those
// positions is the mistake the walk-level omit exists to avoid, and this predicate
// still visits every position.
//
// The check matters because the payload also carries author-written data the policy
// deliberately preserves - a UserError's non-Error cause, its metaData - and a
// `source` key inside those belongs to the app, not to us.
function isErrorNode(value) {
  return type.isString(value.name) && type.isString(value.message);
}

// A prefix slice rather than path.relative or a parse of a `path:line` shape:
// source is `${resolvedPath}:${lineNumber}` only when a line number resolved and
// the bare path otherwise, and removing a prefix never touches the suffix, so both
// forms work without knowing which this is. Applied at every error node carrying a
// source, not only the outermost, because a strip is a no-op when the prefix is
// absent. Mutates the freshly serialized payload in place - nothing else holds it.
function stripConfigDirectory(value, prefix) {
  if (type.isArray(value)) {
    value.forEach((item) => stripConfigDirectory(item, prefix));
    return;
  }
  if (!type.isObject(value)) return;
  if (isErrorNode(value) && type.isString(value.source) && value.source.startsWith(prefix)) {
    value.source = value.source.slice(prefix.length);
  }
  Object.values(value).forEach((child) => stripConfigDirectory(child, prefix));
}

// Guarantees `source` reaches a client config-relative, never as an absolute server
// path. resolveConfigLocation makes it absolute whenever the context carries a
// configDirectory - server-dev and server-e2e do, and production happens not to
// today by omission rather than by invariant, which is the drift this closes.
//
// A rewrite rather than an omission, and it needs the context, so it runs as a pass
// over the serialized payload instead of inside the walk.
function normalizeErrorSources(context, payload) {
  // errorHandler has an else branch for requests with no lowdefyContext, so a
  // missing context is a supported call - it only means no source to normalise.
  const configDirectory = context?.configDirectory;
  if (type.isNone(configDirectory)) return payload;
  // configDirectory is `LOWDEFY_DIRECTORY_CONFIG || process.cwd()` at every site
  // that sets it, so it may be relative or carry a trailing separator, while
  // resolveConfigLocation built source with path.resolve. Compare normalised.
  stripConfigDirectory(payload, `${path.resolve(configDirectory)}${path.sep}`);
  return payload;
}

export default normalizeErrorSources;
