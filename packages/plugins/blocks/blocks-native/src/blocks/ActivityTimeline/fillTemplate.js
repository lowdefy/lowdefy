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

import { get, type } from '@lowdefy/helpers';

const PLACEHOLDER = /\{([^{}|]+)(?:\|([a-z]+))?\}/g;

// "in_progress" reads "In progress".
function humanize(text) {
  const words = text.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toLocaleUpperCase() + words.slice(1);
}

const FILTERS = {
  humanize,
  lower: (text) => text.toLocaleLowerCase(),
  words: (text) => text.replace(/[_-]+/g, ' ').trim().toLocaleLowerCase(),
};

/** The text a placeholder stands for: the value at `path` in the entry, through `filter`. */
export function placeholderText({ entry, path, filter }) {
  const value = get(entry, path.trim(), { default: null });
  if (type.isNone(value)) {
    return '';
  }
  const text = type.isString(value) ? value : String(value);
  return FILTERS[filter] ? FILTERS[filter](text) : text;
}

function pushText(segments, kind, text) {
  if (text === '') {
    return;
  }
  const last = segments[segments.length - 1];
  if (last?.kind === kind) {
    last.text += text;
    return;
  }
  segments.push({ kind, text });
}

/**
 * A line's segments from a template. `{actor}` is the actor; `{path}` is the value at that path
 * in the entry (`{what.to}`, `{subject.key}`). Filters: `{path|humanize}` reads "in_progress" as
 * "In progress", `{path|words}` as "in progress", and `{path|lower}` lower-cases. Text between
 * `**` pairs is strong. A placeholder with no value reads as nothing.
 *
 * @param {Object} params
 * @param {string} params.template
 * @param {Object} params.entry The event.
 * @param {Object} params.actor The event's actor (getActor).
 * @returns {Array<{ kind: 'actor' } | { kind: 'text' | 'strong', text: string }>}
 */
function fillTemplate({ template, entry, actor }) {
  const segments = [];
  String(template)
    .split('**')
    .forEach((part, index) => {
      const kind = index % 2 === 1 ? 'strong' : 'text';
      let last = 0;
      for (const match of part.matchAll(PLACEHOLDER)) {
        pushText(segments, kind, part.slice(last, match.index));
        if (match[1].trim() === 'actor') {
          segments.push(actor);
        } else {
          pushText(segments, kind, placeholderText({ entry, path: match[1], filter: match[2] }));
        }
        last = match.index + match[0].length;
      }
      pushText(segments, kind, part.slice(last));
    });
  return segments;
}

export default fillTemplate;
