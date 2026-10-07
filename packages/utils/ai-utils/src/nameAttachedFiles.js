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

function withoutLowdefyMetadata(part) {
  if (part.providerOptions?.lowdefy === undefined) {
    return part;
  }
  const { lowdefy: _lowdefy, ...providerOptions } = part.providerOptions;
  const { providerOptions: _providerOptions, ...rest } = part;
  if (Object.keys(providerOptions).length === 0) {
    return rest;
  }
  return { ...rest, providerOptions };
}

// Puts a text part naming each attached file just before it in the user messages sent to the
// model, so the model can pass a file's name to a tool (which looks it up in `_agent: files`).
// The model sees an image as content, not by name. AgentChat keeps an upload's storage key in
// providerMetadata.lowdefy, which reaches the model messages as providerOptions.lowdefy; it is
// removed here, so the key stays with Lowdefy. The UI messages that are saved are not changed.
function nameAttachedFiles(prompt) {
  if (!Array.isArray(prompt)) {
    return prompt;
  }
  return prompt.map((message) => {
    if (message.role !== 'user' || !Array.isArray(message.content)) {
      return message;
    }
    const content = [];
    for (const part of message.content) {
      if (part.type !== 'file') {
        content.push(part);
        continue;
      }
      if (typeof part.filename === 'string') {
        content.push({ type: 'text', text: `Attached file: ${part.filename}` });
      }
      content.push(withoutLowdefyMetadata(part));
    }
    return { ...message, content };
  });
}

export default nameAttachedFiles;
