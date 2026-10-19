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

import React, { useState } from 'react';
import { Popover } from 'antd';

import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const PopoverBlock = ({ blockId, classNames = {}, content, methods, properties, styles = {} }) => {
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  return (
    <Popover
      id={blockId}
      arrow={properties.arrow}
      autoAdjustOverflow={properties.autoAdjustOverflow}
      color={properties.color}
      defaultOpen={properties.defaultOpen}
      // Popover used to pass every property to antd, so the undocumented `open`,
      // `destroyTooltipOnHide`, `overlayClassName` and `overlayStyle` keep working.
      destroyOnHidden={properties.destroyOnHidden ?? properties.destroyTooltipOnHide}
      mouseEnterDelay={properties.mouseEnterDelay}
      mouseLeaveDelay={properties.mouseLeaveDelay}
      open={properties.open}
      placement={properties.placement ?? undefined}
      title={renderHtml({ html: properties.title, methods })}
      trigger={properties.trigger ?? undefined}
      zIndex={properties.zIndex}
      className={classNames.element}
      // antd 6 renamed the Popover inner element from `inner` to `container`.
      classNames={{
        root: properties.overlayClassName,
        container: classNames.inner,
        title: classNames.title,
        content: classNames.content,
      }}
      style={styles.element}
      styles={{
        root: properties.overlayStyle,
        // antd 6 deprecated `overlayInnerStyle` in favour of `styles.container`.
        container: { ...properties.overlayInnerStyle, ...styles.inner },
        title: styles.title,
        content: styles.content,
      }}
      content={content.popover && content.popover()}
      onOpenChange={(open) => methods.triggerEvent({ name: 'onOpenChange', event: { open } })}
      getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
    >
      {content.content && content.content()}
      <div id={`${blockId}_${elementId}_popup`} />
    </Popover>
  );
};

export default withTheme('Popover', withBlockDefaults(PopoverBlock));
