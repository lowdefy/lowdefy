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

import { DefaultChatTransport } from 'ai';

class LowdefyChatTransport extends DefaultChatTransport {
  constructor({ pageId, agentId, onToolConfirmModes }) {
    super({
      api: `/api/agent/${pageId}/${agentId}`,
      credentials: 'include',
      fetch: async (url, init) => {
        const response = await globalThis.fetch(url, init);
        const modesHeader = response.headers.get('X-Tool-Confirm-Modes');
        if (modesHeader && onToolConfirmModes) {
          try {
            onToolConfirmModes(JSON.parse(modesHeader));
          } catch {
            // ignore parse errors
          }
        }
        return response;
      },
    });
  }
}

export default LowdefyChatTransport;
