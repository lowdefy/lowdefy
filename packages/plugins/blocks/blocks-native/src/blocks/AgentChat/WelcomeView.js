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
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { type } from '@lowdefy/helpers';

import SystemIcon from '../../shared/SystemIcon.js';

/**
 * An empty conversation: the welcome's glyph on a tinted circle, its title and its description,
 * a little above the middle of the screen. Its prompts are chips above the composer.
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {string} props.testID
 * @param {{ title?: string, description?: string, icon?: string, symbol?: string }} [props.welcome]
 */
function WelcomeView({ colors, components, testID, welcome }) {
  const { height } = useWindowDimensions();
  const title = type.isString(welcome?.title) ? welcome.title : null;
  const description = type.isString(welcome?.description) ? welcome.description : null;
  return (
    <View style={[styles.root, { minHeight: height * 0.5 }]} testID={testID}>
      <View style={[styles.mark, { backgroundColor: colors.tintFill }]}>
        <SystemIcon
          color={colors.tint}
          components={components}
          fallback={type.isString(welcome?.icon) ? welcome.icon : 'Sparkles'}
          size={26}
          symbol={type.isString(welcome?.symbol) ? welcome.symbol : 'sparkles'}
        />
      </View>
      {title === null ? null : (
        <Text accessibilityRole="header" style={[styles.title, { color: colors.label }]}>
          {title}
        </Text>
      )}
      {description === null ? null : (
        <Text style={[styles.description, { color: colors.secondary }]}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  mark: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.26,
    lineHeight: 28,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    letterSpacing: -0.24,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 320,
    textAlign: 'center',
  },
});

export default WelcomeView;
