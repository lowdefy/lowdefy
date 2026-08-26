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
import { Card } from 'antd-mobile';
import { type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

function CardBlock({ classNames = {}, content, methods, properties, styles = {} }) {
  return (
    <Card
      className={classNames.element}
      style={styles.element}
      bodyClassName={classNames.body}
      bodyStyle={styles.body}
      headerClassName={classNames.header}
      headerStyle={styles.header}
      title={
        type.isNone(properties.title)
          ? undefined
          : renderHtml({ html: properties.title, methods })
      }
      extra={
        type.isNone(properties.extra)
          ? undefined
          : renderHtml({ html: properties.extra, methods })
      }
      onClick={() => methods.triggerEvent({ name: 'onClick' })}
    >
      {content.content && content.content()}
    </Card>
  );
}

export default withBlockDefaults(CardBlock);
