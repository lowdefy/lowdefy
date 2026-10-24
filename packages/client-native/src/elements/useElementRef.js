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

import { useCallback, useContext } from 'react';

import ElementsContext from './ElementsContext.js';

/**
 * A ref that registers a native view in the page's element registry while it is mounted, so
 * native actions find it by block id. A block passes it to the control SetFocus focuses:
 *
 * ```js
 * const inputRef = useElementRef({ blockId, kind: 'input' });
 * return <TextInput ref={inputRef} />;
 * ```
 *
 * @param {Object} params
 * @param {string} [params.blockId] The block's id; none for the page's ScrollView.
 * @param {'view'|'input'|'scroll'} params.kind
 */
function useElementRef({ blockId, kind }) {
  const elements = useContext(ElementsContext);
  // React calls the cleanup a ref callback returns when the view unmounts or the ref changes.
  return useCallback(
    (element) => {
      if (elements === null || element === null) {
        return undefined;
      }
      return elements.registry.register({ blockId, element, kind, pageId: elements.pageId });
    },
    [blockId, elements, kind]
  );
}

export default useElementRef;
