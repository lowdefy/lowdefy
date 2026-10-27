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
import { Pressable } from 'react-native';
import { type } from '@lowdefy/helpers';
import { formatIconTitle } from '@lowdefy/client-native';

import meta from './meta.js';

// An icon from the app's icon data, drawn by the native icon renderer. With an onClick event it
// is a button, labelled with its title, and shows the loading icon while the event runs.
function Icon({ components, events, methods, properties, styles = {} }) {
  const icon = <components.Icon events={events} properties={properties} styles={styles} />;
  if (!events.onClick) {
    return icon;
  }
  const title = properties.title ?? formatIconTitle(properties.name);
  return (
    <Pressable
      accessibilityLabel={type.isString(title) && title !== '' ? title : undefined}
      accessibilityRole="button"
      onPress={() => methods.triggerEvent({ name: 'onClick' })}
    >
      {icon}
    </Pressable>
  );
}

Icon.meta = meta;

export default Icon;
