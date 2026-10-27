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

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { ElementsContext } from '@lowdefy/client-native';

/**
 * Keeps the newest message in view, as a chat app does: the conversation is the page's content,
 * so this scrolls the page's scroll view (found in the page's element registry) to its end as a
 * reply grows, when the keyboard comes up, and when the person sends. A touch on the conversation
 * stops the following, so someone reading back is not pulled down; sending, or pressing the
 * "jump to latest" control, follows again.
 *
 * @returns {{ following: boolean, follow: () => void, onContentLayout: () => void,
 *   onTouchStart: () => void }}
 */
function useFollowScroll() {
  const elements = useContext(ElementsContext);
  const followingRef = useRef(true);
  const [following, setFollowing] = useState(true);

  const scrollToEnd = useCallback(
    (animated) => {
      if (elements === null) return;
      const scrollView = elements.registry.find({ kind: 'scroll', pageId: elements.pageId });
      scrollView?.scrollToEnd?.({ animated });
    },
    [elements]
  );

  const setFollow = useCallback((next) => {
    followingRef.current = next;
    setFollowing(next);
  }, []);

  const follow = useCallback(() => {
    setFollow(true);
    // After the frame that draws the message just sent.
    requestAnimationFrame(() => scrollToEnd(true));
  }, [scrollToEnd, setFollow]);

  const onContentLayout = useCallback(() => {
    if (followingRef.current) scrollToEnd(false);
  }, [scrollToEnd]);

  const onTouchStart = useCallback(() => {
    if (followingRef.current) setFollow(false);
  }, [setFollow]);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (followingRef.current) scrollToEnd(true);
    });
    return () => subscription.remove();
  }, [scrollToEnd]);

  return { follow, following, onContentLayout, onTouchStart };
}

export default useFollowScroll;
