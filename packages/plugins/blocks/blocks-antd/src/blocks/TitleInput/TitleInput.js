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
import { Tooltip, Typography } from 'antd';
import { type } from '@lowdefy/helpers';

import { cn, withBlockDefaults } from '@lowdefy/block-utils';
import getCopyableConfig from '../../getCopyableConfig.js';
import InlineEditTextArea from '../../InlineEditTextArea.js';
import useInlineEdit from '../../useInlineEdit.js';
import withTheme from '../withTheme.js';
import '../../inlineEditStyle.css';

const Title = Typography.Title;

const TitleInput = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  loading,
  methods,
  properties,
  styles = {},
  value,
}) => {
  const editable = properties.editable !== false;
  const editConfig = type.isObject(properties.editable) ? properties.editable : {};
  const enabled = editable && !properties.disabled && !loading;
  const text = type.isNone(value) ? '' : value.toString();
  const placeholder = properties.placeholder ?? 'Untitled';
  const inlineEdit = useInlineEdit({
    enabled,
    forceEditing: editConfig.editing,
    methods,
    text,
  });
  const style = { ...styles.element, ...(properties.color && { color: properties.color }) };

  if (inlineEdit.editing) {
    return (
      <Title
        id={blockId}
        ref={inlineEdit.elementRef}
        className={cn('lf-inline-edit lf-inline-edit-editing', classNames.element)}
        italic={properties.italic}
        level={properties.level}
        style={style}
        type={properties.type}
      >
        <InlineEditTextArea
          caretOffset={inlineEdit.caretOffset}
          maxLength={editConfig.maxLength}
          onCancel={inlineEdit.cancel}
          onCommit={inlineEdit.commit}
          placeholder={placeholder}
          value={text}
        />
      </Title>
    );
  }

  const showPlaceholder = editable && text === '';
  const titleEl = (
    <Title
      id={blockId}
      className={cn('lf-inline-edit', { 'lf-inline-edit-enabled': enabled }, classNames.element)}
      code={properties.code}
      italic={properties.italic}
      level={properties.level}
      mark={properties.mark}
      style={style}
      type={properties.type}
      underline={properties.underline}
      copyable={getCopyableConfig({
        blockId,
        classNames,
        copyable: properties.copyable,
        events,
        Icon,
        methods,
        styles,
        text,
      })}
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
                  name: 'onExpand',
                  event: { ellipsis },
                });
              },
            }
          : properties.ellipsis
      }
      // Clicking the text edits it. antd only renders the edit icon, and only when one is set.
      editable={
        enabled && !type.isNone(editConfig.icon)
          ? {
              editing: false,
              icon: (
                <Icon
                  blockId={`${blockId}_editable_icon`}
                  classNames={{ element: classNames.editableIcon }}
                  events={events}
                  properties={editConfig.icon}
                  styles={{ element: styles.editableIcon }}
                />
              ),
              onStart: () => inlineEdit.start(),
              tooltip: editConfig.tooltip,
              triggerType: ['icon'],
            }
          : false
      }
      onClick={inlineEdit.onClick}
      onKeyDown={inlineEdit.onKeyDown}
      ref={inlineEdit.elementRef}
      tabIndex={inlineEdit.tabIndex}
    >
      {showPlaceholder ? <span className="lf-inline-edit-placeholder">{placeholder}</span> : text}
    </Title>
  );
  // Without an icon the tooltip belongs on the text, which is now what the user clicks.
  if (enabled && type.isString(editConfig.tooltip) && type.isNone(editConfig.icon)) {
    return <Tooltip title={editConfig.tooltip}>{titleEl}</Tooltip>;
  }
  return titleEl;
};

export default withTheme('Typography', withBlockDefaults(TitleInput));
