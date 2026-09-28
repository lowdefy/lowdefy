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
import { withBlockDefaults, HtmlComponent } from '@lowdefy/block-utils';

// dataset keys are camelCase (data-record-id → recordId); config authors
// write the attributes in kebab-case, so hand them back as snake_case.
function toSnakeCase(key) {
  return key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

const ClickableHtml = ({ blockId, classNames, events, properties, methods, styles }) => {
  // Each clickable element names the event it fires in its data-event
  // attribute (data-event="onEditClick" → events.onEditClick), so every
  // target in the markup has its own action chain. Its other data-*
  // attributes are the event object.
  function onClick(clickEvent) {
    const target = clickEvent.target.closest('[data-event]');
    if (!target || !clickEvent.currentTarget.contains(target)) return;
    const { event: name, ...data } = target.dataset;
    if (!name) return;
    clickEvent.preventDefault();
    const event = {};
    Object.keys(data).forEach((key) => {
      event[toSnakeCase(key)] = data[key];
    });
    methods.triggerEvent({ name, event });
  }

  return (
    <HtmlComponent
      div={true}
      events={events}
      html={properties.html}
      id={blockId}
      methods={methods}
      className={classNames?.element}
      style={styles?.element}
      onClick={onClick}
    />
  );
};

export default withBlockDefaults(ClickableHtml);
