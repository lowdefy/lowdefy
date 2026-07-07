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
import { NavBar } from 'antd-mobile';
import { type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

function NavBarBlock({ blockId, classNames = {}, methods, properties, styles = {} }) {
  const showBack = properties.back !== false;
  return (
    <NavBar
      className={classNames.element}
      style={styles.element}
      // antd-mobile only omits the back area for back={null}
      back={showBack ? (properties.backText ?? '') : null}
      backArrow={showBack}
      left={
        type.isNone(properties.left) ? undefined : renderHtml({ html: properties.left, methods })
      }
      right={
        type.isNone(properties.right) ? undefined : renderHtml({ html: properties.right, methods })
      }
      onBack={() => methods.triggerEvent({ name: 'onBack' })}
    >
      {renderHtml({
        html: type.isNone(properties.title) ? blockId : properties.title,
        methods,
      })}
    </NavBar>
  );
}

export default withBlockDefaults(NavBarBlock);
