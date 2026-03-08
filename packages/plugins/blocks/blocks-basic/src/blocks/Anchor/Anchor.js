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
import { get } from '@lowdefy/helpers';

const AnchorBlock = ({
  blockId,
  classNames,
  events,
  components: { Icon, Link },
  methods,
  properties,
  styles,
}) => {
  const disabled = properties.disabled || get(events, 'onClick.loading');
  const { icon, title, ...linkProperties } = properties;
  return (
    <Link
      id={blockId}
      className={classNames?.element}
      style={{
        ...(disabled ? { color: '#BEBEBE', cursor: 'not-allowed' } : {}),
        ...styles?.element,
      }}
      disabled={disabled}
      onClick={() => methods.triggerEvent({ name: 'onClick' })}
      {...linkProperties}
    >
      {(defaultTitle) => (
        <>
          {icon && (
            <Icon
              blockId={`${blockId}_icon`}
              events={events}
              properties={
                get(events, 'onClick.loading')
                  ? { name: 'AiOutlineLoading3Quarters', spin: true }
                  : icon
              }
            />
          )}
          {title || defaultTitle}
        </>
      )}
    </Link>
  );
};

AnchorBlock.meta = {
  category: 'display',
  icons: ['AiOutlineLoading3Quarters'],
};

export default AnchorBlock;
