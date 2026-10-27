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

import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * The distance from the top of the window to a KeyboardAvoidingView, for its
 * `keyboardVerticalOffset`. KeyboardAvoidingView compares its frame, which is relative to its
 * parent, with the keyboard's place on the screen. On Android a page sits below an opaque header,
 * so that frame is short by the header and the padding comes out too small. Put `ref` and
 * `onLayout` on a View that holds the KeyboardAvoidingView at its top. On iOS the offset stays 0:
 * the page runs under its translucent bar, and the iOS padding was set by hand for that.
 *
 * @returns {{ offset: number, onLayout: Function, ref: Object }}
 */
function useKeyboardWindowOffset() {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  const onLayout = useCallback(() => {
    if (Platform.OS !== 'android') return;
    ref.current.measureInWindow((x, y) => setOffset(y));
  }, []);
  return { offset, onLayout, ref };
}

export default useKeyboardWindowOffset;
