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

// antd measures an ellipsis that has an expand button, a suffix or a copy button, and truncates
// it by cutting string children. Html content renders as one element that cannot be cut, so the
// text collapsed to "...". Content without markup is passed as a string so it can be cut.
function getTypographyContent({ events, methods, properties }) {
  const { content, copyable, ellipsis } = properties;
  const measuresEllipsis =
    (type.isObject(ellipsis) && (Boolean(ellipsis.expandable) || !type.isNone(ellipsis.suffix))) ||
    (Boolean(ellipsis) && Boolean(copyable));
  if (measuresEllipsis && type.isString(content) && !/[<&]/.test(content)) {
    return content;
  }
  return renderHtml({ html: content, events, methods });
}

export default getTypographyContent;
