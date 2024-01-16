/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { Typography } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

const Paragraph = Typography.Paragraph;

const ParagraphInput = ({
  blockId,
  components: { Icon },
  events,
  loading,
  methods,
  properties,
  value,
}) => {
  const [editing, setEdit] = useState(false);
  const editableEvents = {
    onStart: () => {
      setEdit(true);
      methods.triggerEvent({
        name: 'onStart',
      });
    },
    onChange: (val) => {
      setEdit(false);
      methods.setValue(val);
      methods.triggerEvent({ name: 'onChange', event: { value: val } });
    },
  };
  return (
    <Paragraph
      id={blockId}
      className={methods.makeCssClass(properties.style)}
      code={properties.code}
      copyable={
        type.isObject(properties.copyable)
          ? {
              text: properties.copyable.text || value,
              onCopy: () => {
                methods.triggerEvent({
                  name: 'onCopy',
                  event: { value: properties.copyable.text || value },
                });
              },
              icon:
                properties.copyable.icon &&
                (type.isArray(properties.copyable.icon) ? (
                  [
                    <Icon
                      key="copy-icon"
                      blockId={`${blockId}_copyable_before_icon`}
                      events={events}
                      properties={properties.copyable.icon[0]}
                    />,
                    <Icon
                      key="copied-icon"
                      blockId={`${blockId}_copyable_after_icon`}
                      events={events}
                      properties={properties.copyable.icon[1]}
                    />,
                  ]
                ) : (
                  <Icon
                    blockId={`${blockId}_copyable_icon`}
                    events={events}
                    properties={properties.copyable.icon}
                  />
                )),
              tooltips: properties.copyable.tooltips,
            }
          : properties.copyable
      }
      delete={properties.delete}
      disabled={properties.disabled || loading}
      ellipsis={
        type.isObject(properties.ellipsis)
          ? {
              rows: properties.ellipsis.rows,
              expandable: properties.ellipsis.expandable,
              suffix: properties.ellipsis.suffix,
              onExpand: (ellipsis) => {
                methods.triggerEvent({
                  name: 'onCopy',
                  event: { ellipsis },
                });
              },
              onEllipsis: (ellipsis) => {
                methods.triggerEvent({
                  name: 'onCopy',
                  event: { ellipsis },
                });
              },
            }
          : properties.ellipsis
      }
      editable={
        type.isObject(properties.editable)
          ? {
              icon: properties.editable.icon && (
                <Icon
                  blockId={`${blockId}_editable_icon`}
                  events={events}
                  properties={properties.editable.icon}
                />
              ),
              tooltip: properties.editable.tooltip,
              editing: properties.editable.editing || editing,
              maxLength: properties.editable.maxLength,
              autoSize: properties.editable.autoSize,
              ...editableEvents,
            }
          : properties.editable !== false && editableEvents
      }
      italic={properties.italic}
      mark={properties.mark}
      strong={properties.strong}
      type={properties.type}
      underline={properties.underline}
    >
      {!type.isNone(value) ? value.toString() : ''}
    </Paragraph>
  );
};

ParagraphInput.defaultProps = blockDefaultProps;
ParagraphInput.meta = {
  valueType: 'string',
  category: 'input',
  icons: [],
  styles: ['blocks/ParagraphInput/style.less'],
};

export default ParagraphInput;
