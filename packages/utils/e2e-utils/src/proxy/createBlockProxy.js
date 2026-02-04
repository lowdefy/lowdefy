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

function createBlockProxy({ page, blockMap, helperRegistry, mode = 'set' }) {
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

        return new Proxy(
          {},
          {
            get(_, methodName) {
              if (typeof methodName !== 'string') return undefined;
              // Prevent Promise unwrapping - proxy is not a thenable
              if (methodName === 'then') return undefined;

              return async (...args) => {
                const helper = await helperRegistry.get(blockInfo.helper);
                if (!helper) {
                  throw new Error(
                    `Block type "${blockInfo.type}" does not have e2e helpers.\n` +
                      `Add e2e.js to: ${blockInfo.helper.replace('/e2e/', '/src/blocks/')}/e2e.js`
                  );
                }

                const methods = helper[mode];
                if (!methods) {
                  throw new Error(`Block type "${blockInfo.type}" has no ${mode} methods defined.`);
                }

                const method = methods[methodName];
                if (typeof method !== 'function') {
                  const available = Object.keys(methods)
                    .filter((k) => typeof methods[k] === 'function')
                    .join(', ');
                  throw new Error(
                    `Block type "${blockInfo.type}" has no ${mode} method "${methodName}".\n` +
                      `Available ${mode} methods: ${available || '(none)'}`
                  );
                }

                return method(page, blockId, ...args);
              };
            },
          }
        );
      },
    }
  );
}

export default createBlockProxy;
