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

import { useContext, useLayoutEffect } from 'react';

import { ListItemContext } from './MarkdownListContext.js';

/**
 * Where a GFM task item's `[ ]` or `[x]` stood in its text (MarkdownTokenizer puts a mark token
 * there). It draws nothing: it tells its list item it is a task, before the item paints, and the
 * item draws the box in its marker's place.
 *
 * @param {Object} props
 * @param {boolean} props.checked
 */
function TaskMark({ checked }) {
  const item = useContext(ListItemContext);
  useLayoutEffect(() => {
    item.setTask({ checked });
    return () => item.setTask(null);
  }, [item, checked]);
  return null;
}

export default TaskMark;
