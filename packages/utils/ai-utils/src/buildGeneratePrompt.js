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

// The model gets the prompt as plain text, or, with files, as one user message
// whose content is the prompt followed by a part per file. URLs stay URLs so
// the provider fetches them.
function buildGeneratePrompt({ prompt, files }) {
  if (files.length === 0) {
    return prompt;
  }
  const fileParts = files.map(({ url, mediaType }) => {
    if (mediaType.startsWith('image/')) {
      return { type: 'image', image: new URL(url), mediaType };
    }
    return { type: 'file', data: new URL(url), mediaType };
  });
  return [{ role: 'user', content: [{ type: 'text', text: prompt }, ...fileParts] }];
}

export default buildGeneratePrompt;
