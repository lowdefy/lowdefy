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
import { type } from '@lowdefy/helpers';

const DEFAULT_REPLACEMENT = '[removed]';

// The build checks a literal redact config; this checks it again after operators are
// evaluated, since a pattern an operator returns is only known now. Returns the patterns as
// { name, regex }, each regex global so a replace masks every match.
function buildPatterns({ redact, configKey }) {
  if (!type.isObject(redact)) {
    throw new ConfigError('Agent "redact" should be an object.', { received: redact, configKey });
  }
  if (!type.isArray(redact.patterns) || redact.patterns.length === 0) {
    throw new ConfigError('Agent "redact.patterns" should be a non-empty array.', {
      received: redact.patterns,
      configKey,
    });
  }
  return redact.patterns.map((entry, index) => {
    const { name, pattern, flags } = type.isString(entry) ? { pattern: entry } : entry ?? {};
    const location = `redact.patterns[${index}]`;
    if (!type.isString(pattern)) {
      throw new ConfigError(`Agent "${location}.pattern" should be a string.`, {
        received: pattern,
        configKey,
      });
    }
    if (!type.isNone(name) && !type.isString(name)) {
      throw new ConfigError(`Agent "${location}.name" should be a string.`, {
        received: name,
        configKey,
      });
    }
    if (!type.isNone(flags) && !type.isString(flags)) {
      throw new ConfigError(`Agent "${location}.flags" should be a string.`, {
        received: flags,
        configKey,
      });
    }
    const allFlags = (flags ?? '').includes('g') ? flags : `${flags ?? ''}g`;
    let regex;
    try {
      regex = new RegExp(pattern, allFlags);
    } catch (error) {
      throw new ConfigError(
        `Agent "${location}" is not a valid regular expression: ${error.message}`,
        {
          cause: error,
          received: pattern,
          configKey,
        }
      );
    }
    // A pattern that matches empty text would put the replacement between every character.
    if (regex.test('')) {
      throw new ConfigError(`Agent "${location}" matches empty text.`, {
        received: pattern,
        configKey,
      });
    }
    regex.lastIndex = 0;
    return { name: name ?? location, regex };
  });
}

// Masks every match of the agent's redact patterns in the text parts of the user's messages,
// before the model, title generation, tools and hooks see them. Every user message is masked,
// not only the last: the browser sends the whole conversation each turn. Assistant and tool
// messages, and file parts, are left as they are. The messages are the client's, not yet
// validated, so a malformed message or part is passed over here and refused by the agent's
// message validation. counts holds the replacements made per pattern name, never the text.
function redactMessages({ messages, redact, configKey }) {
  const patterns = buildPatterns({ redact, configKey });
  const replacement = redact.replacement ?? DEFAULT_REPLACEMENT;
  if (!type.isString(replacement)) {
    throw new ConfigError('Agent "redact.replacement" should be a string.', {
      received: replacement,
      configKey,
    });
  }
  const counts = {};

  function maskText(text) {
    let masked = text;
    for (const { name, regex } of patterns) {
      masked = masked.replace(regex, () => {
        counts[name] = (counts[name] ?? 0) + 1;
        return replacement;
      });
    }
    return masked;
  }

  const redacted = messages.map((message) => {
    if (message?.role !== 'user' || !type.isArray(message.parts)) return message;
    return {
      ...message,
      parts: message.parts.map((part) => {
        if (part?.type !== 'text' || !type.isString(part.text)) return part;
        return { ...part, text: maskText(part.text) };
      }),
    };
  });

  return { messages: redacted, counts };
}

export default redactMessages;
