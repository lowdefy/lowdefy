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

// The methods object handed to a lazy block's implementation. Object.create
// keeps it live: the framework re-assigns setValue, translate, List's pushItem
// and others onto the real methods object on every render, and lookups fall
// through to them. Only registerMethod is its own, so declared methods are
// recorded for the proxies instead of replacing them.
function createImplementationMethods({ blockId, declaredMethods, methods, queue, warnedMethods }) {
  const implementationMethods = Object.create(methods);
  implementationMethods.registerMethod = function registerMethod(method, implementation) {
    if (declaredMethods.includes(method)) {
      queue.register(method, implementation);
      return;
    }
    if (process.env.NODE_ENV !== 'production' && !warnedMethods.has(method)) {
      warnedMethods.add(method);
      // eslint-disable-next-line no-console
      console.warn(
        `Lazy block "${blockId}" registered method "${method}", which is not declared in its meta.methods. Calls to "${method}" before the block loads will fail. Add "${method}" to meta.methods.`
      );
    }
    methods.registerMethod(method, implementation);
  };
  return implementationMethods;
}

export default createImplementationMethods;
