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
import { Card } from 'antd';
import { isEventFromDomDescendant, renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

import withTheme from '../withTheme.js';

// Compact keeps the header inset in line with the body, so titles and content stay aligned.
const headerPadding = { compact: 12 };
const bodyPadding = { compact: 12, none: 0 };

const CardBlock = ({
  blockId,
  classNames = {},
  content,
  properties,
  methods,
  events,
  styles = {},
}) => (
  <Card
    id={blockId}
    title={content.title ? content.title() : renderHtml({ html: properties.title, methods })}
    variant={properties.bordered === false ? 'borderless' : properties.variant ?? undefined}
    actions={content.actions && [content.actions()]}
    cover={content.cover && content.cover()}
    extra={content.extra && content.extra()}
    hoverable={properties.hoverable}
    loading={properties.loading}
    // antd 6 renamed the `default` size to `medium`.
    size={properties.size === 'default' ? 'medium' : properties.size}
    type={properties.inner ? 'inner' : null}
    onClick={(event) => {
      if (isEventFromDomDescendant(event)) methods.triggerEvent({ name: 'onClick' });
    }}
    className={classNames.element}
    classNames={{
      header: classNames.header,
      title: classNames.title,
      body: classNames.body,
      cover: classNames.cover,
      actions: classNames.actions,
      extra: classNames.extra,
    }}
    style={{ outline: 'none', cursor: events.onClick && 'pointer', ...styles.element }}
    styles={{
      header: { paddingInline: headerPadding[properties.padding], ...styles.header },
      title: styles.title,
      body: { padding: bodyPadding[properties.padding], ...styles.body },
      cover: styles.cover,
      actions: styles.actions,
      extra: styles.extra,
    }}
  >
    {content.content && content.content()}
  </Card>
);

export default withTheme('Card', withBlockDefaults(CardBlock));
