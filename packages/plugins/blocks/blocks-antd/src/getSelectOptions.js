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

import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

// Builds the antd Select `options` for Selector and MultipleSelector from the normalised entries
// of useSelectorOptions. The antd value is the entry index, which getSelectedIndex maps block
// values to. Labels are rendered html elements, so each option also carries a `filterString`
// (the option's filterString, else its label html) for filterSelectorOption to search.
function getSelectOptions({ blockId, classNames = {}, entries, methods, styles = {} }) {
  return entries.map((entry, index) => {
    const option = {
      className: classNames.options,
      id: `${blockId}_${index}`,
      value: `${index}`,
    };
    if (type.isPrimitive(entry)) {
      return {
        ...option,
        filterString: `${entry}`,
        label: renderHtml({ html: `${entry}`, methods }),
        style: styles.options,
      };
    }
    const html = type.isNone(entry.label) ? `${entry.value}` : entry.label;
    return {
      ...option,
      disabled: entry.disabled,
      // An empty filterString falls back to the label, as it did before options were migrated.
      filterString: entry.filterString || `${html}`,
      label: renderHtml({ html, methods }),
      style: {
        ...styles.options,
        ...entry.style,
        ...(entry.color ? { color: entry.color } : {}),
      },
    };
  });
}

export default getSelectOptions;
