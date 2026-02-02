/*
  Copyright 2020-2024 Lowdefy, Inc

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

function createBlockProxy({ page, blockMap, helperRegistry }) {
  return new Proxy(
    {},
    {
      get(_, blockId) {
        if (typeof blockId !== 'string') return undefined;

        const blockInfo = blockMap[blockId];
        if (!blockInfo) {
          const available = Object.keys(blockMap).join(', ');
          throw new Error(
            `Block "${blockId}" not found on page. Available blocks: ${available || '(none)'}`
          );
        }

        // Return a proxy that routes method calls to the helper
        return new Proxy(
          {},
          {
            get(_, methodName) {
              if (typeof methodName !== 'string') return undefined;

              return async (...args) => {
                const helper = await helperRegistry.get(blockInfo.helper);
                if (!helper) {
                  throw new Error(
                    `Block type "${blockInfo.type}" does not have e2e helpers.\n` +
                      `Add e2e.js to: ${blockInfo.helper.replace('/e2e/', '/src/blocks/')}/e2e.js`
                  );
                }
                if (typeof helper[methodName] !== 'function') {
                  const available = Object.keys(helper)
                    .filter((k) => typeof helper[k] === 'function')
                    .join(', ');
                  throw new Error(
                    `Block type "${blockInfo.type}" has no method "${methodName}".\n` +
                      `Available methods: ${available || '(none)'}`
                  );
                }
                return helper[methodName](page, blockId, ...args);
              };
            },
          }
        );
      },
    }
  );
}

export default createBlockProxy;
