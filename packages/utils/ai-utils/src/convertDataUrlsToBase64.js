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

// Convert data: URLs in file parts to raw base64 so the AI SDK does not attempt
// to download them (it only supports http/https).  The mediaType field already
// carries the MIME type, so nothing is lost.
function convertDataUrlsToBase64(messages) {
  return messages.map((msg) => {
    if (!msg.parts) return msg;
    const converted = msg.parts.map((part) => {
      if (part.type !== 'file' || typeof part.url !== 'string' || !part.url.startsWith('data:')) {
        return part;
      }
      const commaIndex = part.url.indexOf(',');
      if (commaIndex === -1) return part;
      return { ...part, url: part.url.slice(commaIndex + 1) };
    });
    return { ...msg, parts: converted };
  });
}

export default convertDataUrlsToBase64;
