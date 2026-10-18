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
import { StyleSheet, View } from 'react-native';

import SkeletonShape from '../../skeleton/SkeletonShape.js';

/**
 * A conversation loading: shimmering shapes of a question and a reply, as the transcript will lay
 * out, so nothing moves when it arrives.
 *
 * @param {Object} props
 * @param {string} props.testID
 */
function ChatSkeleton({ testID }) {
  return (
    <View style={styles.root} testID={testID}>
      <SkeletonShape style={styles.question} />
      <View style={styles.reply}>
        <SkeletonShape style={[styles.line, { width: '92%' }]} />
        <SkeletonShape style={[styles.line, { width: '84%' }]} />
        <SkeletonShape style={[styles.line, { width: '58%' }]} />
      </View>
      <SkeletonShape style={[styles.question, { width: '46%' }]} />
      <View style={styles.reply}>
        <SkeletonShape style={[styles.line, { width: '88%' }]} />
        <SkeletonShape style={[styles.line, { width: '70%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 20, paddingTop: 8 },
  question: { alignSelf: 'flex-end', borderRadius: 18, height: 40, width: '62%' },
  reply: { gap: 8 },
  line: { borderRadius: 4, height: 14 },
});

export default ChatSkeleton;
