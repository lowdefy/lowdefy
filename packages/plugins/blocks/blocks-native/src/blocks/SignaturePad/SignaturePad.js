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

import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { type } from '@lowdefy/helpers';

import getLabelProperties from '../Label/getLabelProperties.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import playFeedback from '../../device/playFeedback.js';
import toSignatureValue, { toPath } from './toSignatureValue.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

// A signature drawn with a finger. Each stroke is kept as points; when a stroke ends the value is
// set to { svg, strokes, width, height } (toSignatureValue). A value set from state redraws it.
function SignaturePad({
  blockId,
  loading,
  methods,
  properties,
  required,
  styles,
  validation,
  value,
}) {
  const { tokens } = useBlockTokens({ properties });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ properties });
  const disabled = loading === true || properties.disabled === true;
  const height = properties.height ?? 200;
  const color = properties.color ?? tokens.colorLabel;
  const strokeWidth = properties.strokeWidth ?? 2.5;
  const [size, setSize] = useState({ width: 0, height });
  const [drawing, setDrawing] = useState(null);
  const latest = useRef({});
  const strokes = type.isArray(value?.strokes) ? value.strokes : [];
  latest.current = { color, disabled, drawing, size, strokes, strokeWidth };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !latest.current.disabled,
        onMoveShouldSetPanResponder: () => !latest.current.disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setDrawing([[locationX, locationY]]);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setDrawing((points) => [...(points ?? []), [locationX, locationY]]);
        },
        onPanResponderRelease: () => {
          const current = latest.current;
          if (current.drawing === null) return;
          const next = toSignatureValue({
            color: current.color,
            height: current.size.height,
            strokes: [...current.strokes, current.drawing],
            strokeWidth: current.strokeWidth,
            width: current.size.width,
          });
          setDrawing(null);
          methods.setValue(next);
          methods.triggerEvent({ name: 'onChange', event: { value: next } });
        },
      }),
    [methods]
  );

  const clear = () => {
    playFeedback();
    setDrawing(null);
    methods.setValue(null);
    methods.triggerEvent({ name: 'onChange', event: { value: null } });
    methods.triggerEvent({ name: 'onClear' });
  };
  const empty = strokes.length === 0 && drawing === null;
  return (
    <Label
      blockId={blockId}
      properties={labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <View
        accessibilityLabel={accessibilityLabel ?? 'Signature'}
        onLayout={(event) => setSize(event.nativeEvent.layout)}
        style={[
          {
            backgroundColor: tokens.colorCell,
            borderColor: tokens.colorSeparator,
            borderRadius: 12,
            borderWidth: 1,
            height,
            opacity: disabled ? 0.5 : 1,
            overflow: 'hidden',
          },
          styles.element,
        ]}
        testID={`${blockId}_input`}
        {...responder.panHandlers}
      >
        {empty ? (
          <Text
            pointerEvents="none"
            style={{
              color: tokens.colorTertiaryLabel,
              left: 16,
              position: 'absolute',
              top: height / 2 - 10,
            }}
          >
            {properties.placeholder ?? 'Sign here'}
          </Text>
        ) : null}
        <Svg height="100%" pointerEvents="none" width="100%">
          {[...strokes, ...(drawing === null ? [] : [drawing])].map((stroke, index) => (
            <Path
              d={toPath(stroke)}
              fill="none"
              key={index}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={strokeWidth}
            />
          ))}
        </Svg>
        {empty || disabled ? null : (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={clear}
            style={{ position: 'absolute', right: 12, top: 8 }}
            testID={`${blockId}_clear`}
          >
            <Text style={{ color: tokens.colorTint }}>{properties.clearText ?? 'Clear'}</Text>
          </Pressable>
        )}
      </View>
    </Label>
  );
}

SignaturePad.meta = meta;

export default SignaturePad;
