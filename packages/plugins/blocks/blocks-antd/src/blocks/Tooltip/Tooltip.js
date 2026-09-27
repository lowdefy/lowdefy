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

import React from 'react';
import { Tooltip } from 'antd';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import withTheme from '../withTheme.js';

// antd 5 folded `arrowPointAtCenter` into `arrow: { pointAtCenter }`; Lowdefy keeps the property.
function getArrow({ arrow, arrowPointAtCenter }) {
  if (arrow === false || type.isObject(arrow)) {
    return arrow;
  }
  if (arrowPointAtCenter === true) {
    return { pointAtCenter: true };
  }
  return arrow;
}

const TooltipBlock = ({ blockId, classNames = {}, content, properties, methods, styles = {} }) => (
  <Tooltip
    id={blockId}
    title={renderHtml({ html: properties.title, methods })}
    arrow={getArrow({
      arrow: properties.arrow,
      arrowPointAtCenter: properties.arrowPointAtCenter,
    })}
    autoAdjustOverflow={properties.autoAdjustOverflow}
    color={properties.color}
    defaultOpen={properties.defaultOpen}
    // antd 6 renamed `destroyTooltipOnHide` to `destroyOnHidden`.
    destroyOnHidden={properties.destroyTooltipOnHide}
    mouseEnterDelay={properties.mouseEnterDelay}
    mouseLeaveDelay={properties.mouseLeaveDelay}
    placement={properties.placement}
    trigger={properties.trigger ?? 'hover'}
    zIndex={properties.zIndex}
    onOpenChange={(open) => methods.triggerEvent({ name: 'onOpenChange', event: { open } })}
    className={classNames.element}
    // antd 6 renamed the Tooltip inner element from `inner` to `container`.
    classNames={{ container: classNames.inner }}
    style={styles.element}
    styles={{ container: styles.inner }}
  >
    {content.content && content.content()}
    {
      '' // required by antd to wrap element in span tag.
    }
  </Tooltip>
);

export default withTheme('Tooltip', withBlockDefaults(TooltipBlock));
