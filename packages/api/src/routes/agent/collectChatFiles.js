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

// The files the person attached in the conversation the chat request carried: every file part
// that holds a storage key (AgentChat sets providerMetadata.lowdefy.key on an upload), in message
// order. A tool endpoint reads them with `_agent: files`. They come from the request, not from a
// tool call, so the model can only name a file of this conversation. The messages are the
// client's, not yet validated, so a malformed message or part is passed over here and refused
// by the agent's message validation.
function collectChatFiles({ messages }) {
  const files = [];
  for (const message of messages) {
    if (!type.isArray(message?.parts)) continue;
    for (const part of message.parts) {
      const key = part?.providerMetadata?.lowdefy?.key;
      if (part?.type === 'file' && type.isString(key)) {
        files.push({ key, filename: part.filename ?? null, mediaType: part.mediaType });
      }
    }
  }
  return files;
}

export default collectChatFiles;
