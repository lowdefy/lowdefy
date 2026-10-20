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

import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { type } from '@lowdefy/helpers';

import formatFileSize from './formatFileSize.js';
import getDeviceFeature from '../../device/getDeviceFeature.js';
import getFileSources from './getFileSources.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import NativeMenu from '../../shared/NativeMenu.js';
import playFeedback from '../../device/playFeedback.js';
import uploadFiles from '../../actions/uploadFiles.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

async function pickFrom({ source, properties, remaining }) {
  const multiple = remaining > 1;
  const imageOptions = {
    maxCount: remaining,
    maxSize: properties.maxSize ?? 1600,
    mediaTypes: properties.mediaTypes ?? ['images', 'videos'],
    multiple,
    quality: properties.quality ?? 0.7,
  };
  if (source === 'photos') {
    return getDeviceFeature({ feature: 'photos', action: 'FileInput' }).pick(imageOptions);
  }
  if (source === 'camera') {
    return getDeviceFeature({ feature: 'camera', action: 'FileInput' }).takePhoto(imageOptions);
  }
  return getDeviceFeature({ feature: 'files', action: 'FileInput' }).pick({
    multiple,
    types: properties.fileTypes,
  });
}

function FileRow({ blockId, components, disabled, file, index, onRemove, tokens }) {
  const isImage = type.isString(file.mimeType) && file.mimeType.startsWith('image/');
  return (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: tokens.colorSeparator,
        borderBottomWidth: 0.5,
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8,
      }}
      testID={`${blockId}_file_${index}`}
    >
      {isImage ? (
        <Image
          contentFit="cover"
          source={{ uri: file.uri }}
          style={{ borderRadius: 6, height: 40, width: 40 }}
        />
      ) : (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: tokens.colorTertiarySystemFill,
            borderRadius: 6,
            height: 40,
            justifyContent: 'center',
            width: 40,
          }}
        >
          <components.Icon
            properties={{ name: 'File' }}
            styles={{ element: { color: tokens.colorSecondaryLabel, fontSize: 20 } }}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: tokens.colorLabel }}>
          {file.name}
        </Text>
        <Text style={{ color: tokens.colorSecondaryLabel, fontSize: 13 }}>
          {formatFileSize(file.size)}
        </Text>
      </View>
      {disabled ? null : (
        <Pressable
          accessibilityLabel={`Remove ${file.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onRemove(index)}
          testID={`${blockId}_remove_${index}`}
        >
          <components.Icon
            properties={{ name: 'X' }}
            styles={{ element: { color: tokens.colorSecondaryLabel, fontSize: 18 } }}
          />
        </Pressable>
      )}
    </View>
  );
}

// A form input holding files picked from Photos, the camera or Files, each shown as a row with a
// thumbnail or file glyph, its size and a remove button. With `upload`, each file is sent to an
// API endpoint as it is added and keeps the answer.
function FileInput({
  blockId,
  components,
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
  const [busy, setBusy] = useState(false);
  const files = type.isArray(value) ? value : [];
  const remaining = type.isNumber(properties.maxCount)
    ? properties.maxCount - files.length
    : Infinity;
  const sources = getFileSources(properties.sources);
  const disabled = loading === true || properties.disabled === true || busy;

  const setFiles = (next) => {
    methods.setValue(next);
    methods.triggerEvent({ name: 'onChange', event: { value: next } });
  };
  const add = async (source) => {
    setBusy(true);
    try {
      const picked = await pickFrom({ source, properties, remaining });
      const uploaded = await uploadFiles({
        action: 'FileInput',
        files: picked.slice(0, remaining),
        upload: properties.upload,
      });
      if (uploaded.length > 0) {
        playFeedback('success');
        setFiles([...files, ...uploaded]);
      }
    } catch (error) {
      methods.triggerEvent({ name: 'onError', event: { error: { message: error.message } } });
    } finally {
      setBusy(false);
    }
  };
  const remove = (index) => {
    playFeedback();
    setFiles(files.filter((file, fileIndex) => fileIndex !== index));
  };
  const button = (
    <View
      style={{ alignItems: 'center', flexDirection: 'row', gap: 6, paddingVertical: 10 }}
      testID={`${blockId}_add`}
    >
      {busy ? (
        <ActivityIndicator color={tokens.colorTint} size="small" />
      ) : (
        <components.Icon
          properties={{ name: 'Paperclip' }}
          styles={{ element: { color: tokens.colorTint, fontSize: 18 } }}
        />
      )}
      <Text style={{ color: tokens.colorTint, fontSize: 17 }}>
        {properties.buttonText ?? 'Add'}
      </Text>
    </View>
  );
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
        accessibilityLabel={accessibilityLabel}
        style={styles.element}
        testID={`${blockId}_input`}
      >
        {files.map((file, index) => (
          <FileRow
            blockId={blockId}
            components={components}
            disabled={disabled}
            file={file}
            index={index}
            key={`${file.uri}-${index}`}
            onRemove={remove}
            tokens={tokens}
          />
        ))}
        {remaining > 0 && sources.length > 0 ? (
          <NativeMenu
            actions={sources.map((source) => ({
              id: source.id,
              title: source.title,
              image: source.sfSymbol,
            }))}
            disabled={disabled}
            onSelect={add}
            testID={`${blockId}_menu`}
          >
            {button}
          </NativeMenu>
        ) : null}
      </View>
    </Label>
  );
}

FileInput.meta = meta;

export default FileInput;
