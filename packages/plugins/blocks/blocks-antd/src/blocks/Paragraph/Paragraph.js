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
import { withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';
import { Typography } from 'antd';

import getEllipsisConfig from '../getEllipsisConfig.js';
import getTypographyContent from '../getTypographyContent.js';
import withTheme from '../withTheme.js';

const Paragraph = Typography.Paragraph;

const ParagraphBlock = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  methods,
  properties,
  styles = {},
}) => (
  <Paragraph
    id={blockId}
    actions={properties.actions}
    className={classNames.element}
    classNames={{ actions: classNames.actions }}
    code={properties.code}
    copyable={
      type.isObject(properties.copyable)
        ? {
            text: properties.copyable.text || properties.content,
            onCopy: () => {
              methods.triggerEvent({
                name: 'onCopy',
                event: { value: properties.copyable.text || properties.content },
              });
            },
            icon:
              properties.copyable.icon &&
              (type.isArray(properties.copyable.icon) ? (
                [
                  <Icon
                    key="copy-icon"
                    blockId={`${blockId}_copyable_before_icon`}
                    classNames={{ element: classNames.copyableIcon }}
                    events={events}
                    properties={properties.copyable.icon[0]}
                    styles={{ element: styles.copyableIcon }}
                  />,
                  <Icon
                    key="copied-icon"
                    blockId={`${blockId}_copyable_after_icon`}
                    classNames={{ element: classNames.copyableIcon }}
                    events={events}
                    properties={properties.copyable.icon[1]}
                    styles={{ element: styles.copyableIcon }}
                  />,
                ]
              ) : (
                <Icon
                  blockId={`${blockId}_copyable_icon`}
                  classNames={{ element: classNames.copyableIcon }}
                  events={events}
                  properties={properties.copyable.icon}
                  styles={{ element: styles.copyableIcon }}
                />
              )),
            tooltips: properties.copyable.tooltips,
          }
        : properties.copyable && {
            text: properties.content,
            onCopy: () => {
              methods.triggerEvent({
                name: 'onCopy',
                event: { value: properties.content },
              });
            },
          }
    }
    delete={properties.delete}
    disabled={properties.disabled}
    ellipsis={getEllipsisConfig({ ellipsis: properties.ellipsis, methods })}
    italic={properties.italic}
    keyboard={properties.keyboard}
    mark={properties.mark}
    strong={properties.strong}
    style={styles.element}
    styles={{ actions: styles.actions }}
    type={properties.type === 'default' ? undefined : properties.type}
    underline={properties.underline}
  >
    {getTypographyContent({ events, methods, properties })}
  </Paragraph>
);

export default withTheme('Typography', withBlockDefaults(ParagraphBlock));
