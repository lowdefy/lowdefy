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

import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

// A stand-in for @expo/ui's community BottomSheet. It draws its children while `index` is 0 or
// more, as the native sheet presents them, and keeps its props. As the native sheet, it calls
// onClose once per dismissal: when index turns -1, or when a test swipes it down with
// fireEvent(view, 'swipeDismiss').
function BottomSheet({
  backgroundStyle,
  children,
  enableDynamicSizing,
  enablePanDownToClose,
  handleComponent,
  index,
  onClose,
  snapPoints,
}) {
  const closed = useRef(index < 0);
  function fireClose() {
    if (closed.current) return;
    closed.current = true;
    onClose?.();
  }
  useEffect(() => {
    if (index < 0) {
      fireClose();
    } else {
      closed.current = false;
    }
  });
  return (
    <View
      backgroundStyle={backgroundStyle}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose}
      handleComponent={handleComponent}
      index={index}
      onSwipeDismiss={fireClose}
      snapPoints={snapPoints}
      testID="expo-ui-bottom-sheet"
    >
      {index >= 0 ? children : null}
    </View>
  );
}

export { BottomSheet };
export default BottomSheet;
