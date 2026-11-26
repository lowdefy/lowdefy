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

import { resolveTarget } from '@lowdefy/engine';
import { type } from '@lowdefy/helpers';

// Follows a menu item's link as its Link component does once the item's events have fired
// (blocks-antd buildMenuItems): the link's own props, with url and newTab read from its
// properties too, through the engine's link. A link that resolves no target draws no anchor and
// goes nowhere; a newTab link opens another tab and leaves this page where it is.
function followMenuLink({ block, item }) {
  const { link, index } = item;
  const { class: _class, style: _style, ...rest } = link;
  const props = {
    ...rest,
    id: link.pageId ?? link.id ?? index,
    url: link.url ?? link.properties?.url,
    newTab: link.newTab ?? link.properties?.newTab,
  };
  if (props.newTab === true) {
    return;
  }
  const { lowdefy } = block.context._internal;
  const hasTarget =
    props.back === true ||
    type.isString(props.href) ||
    !type.isNone(
      resolveTarget({
        lowdefy,
        target: {
          home: props.home,
          pageId: props.pageId,
          pathParams: props.pathParams,
          url: props.url,
          urlQuery: props.urlQuery,
        },
      })
    );
  if (hasTarget) {
    lowdefy._internal.link(props);
  }
}

export default followMenuLink;
