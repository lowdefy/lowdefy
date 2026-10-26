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

// The Link component blocks get through `components.Link`: a pressable that follows the link as
// the Link action does. It takes the Link action's params (pageId, url, back, input, urlQuery…).
function createLinkComponent(lowdefy) {
  function Link({ children, disabled, style, testID, ...props }) {
    return (
      <Pressable
        accessibilityRole="link"
        disabled={disabled === true}
        onPress={() => lowdefy._internal.link({ disabled, ...props })}
        style={style}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }
  return Link;
}

export default createLinkComponent;
