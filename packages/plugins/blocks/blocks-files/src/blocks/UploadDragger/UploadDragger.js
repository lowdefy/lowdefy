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

import React, { useEffect } from 'react';
import { Upload as AntdUpload, theme as antdTheme } from 'antd';
import { blockRootProps, cn, renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import useFileList from '../utils/useFileList.js';
import getEmitFileContent from '../utils/getEmitFileContent.js';
import getUploadRequest from '../utils/getUploadRequest.js';
import getOnPaste from '../utils/getOnPaste.js';
import withTheme from '../../withTheme.js';

import './style.module.css';

const { Dragger } = AntdUpload;

const UploadDragger = ({ blockId, classNames = {}, methods, properties, styles = {}, value }) => {
  const [state, loadFileList, setFileList, removeFile, setValue] = useFileList({
    properties,
    methods,
    value,
  });
  const emitFileContent = properties.emitFileContent === true;
  const uploadRequest = emitFileContent
    ? getEmitFileContent({ methods, setFileList })
    : getUploadRequest({ methods, setFileList });
  const onPaste = getOnPaste({ uploadRequest, properties });
  useEffect(() => {
    if (!emitFileContent) {
      methods.registerEvent({
        name: '__getUploadPolicy',
        actions: [
          {
            id: '__getUploadPolicy',
            type: 'Request',
            params: [properties.uploadPolicyRequestId],
          },
        ],
      });
    }
  }, []);
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(state)) {
      setValue(value);
    }
  }, [value]);
  useEffect(() => {
    methods.registerMethod('uploadFromPaste', async () => {
      await onPaste();
    });
  }, [onPaste]);
  const { token } = antdTheme.useToken();
  const height = type.isNone(properties.height) ? token.controlHeight : properties.height;
  return (
    <div
      {...blockRootProps({
        blockId,
        classNames,
        styles,
        className: 'lf-upload-dragger',
        style: { '--lf-dragger-height': type.isNumber(height) ? `${height}px` : height },
      })}
      onPaste={onPaste}
    >
      <Dragger
        accept={properties.accept ?? '*'}
        beforeUpload={loadFileList}
        classNames={{
          trigger: classNames.trigger,
          list: classNames.list,
          item: classNames.item,
        }}
        styles={{
          root: { display: 'block' },
          trigger: styles.trigger,
          list: styles.list,
          item: styles.item,
        }}
        customRequest={uploadRequest}
        disabled={properties.disabled}
        fileList={state.fileList}
        maxCount={properties.maxCount}
        multiple={!properties.singleFile} // Allows selection of multiple files at once, does not block multiple uploads
        onRemove={removeFile}
        showUploadList={properties.showUploadList}
        onChange={({ file, fileList }) => {
          // emitFileContent triggers onChange itself once the content is read,
          // so the file object in the event payload carries the base64 content.
          if (!emitFileContent) {
            methods.triggerEvent({ name: 'onChange', event: { file, fileList } });
          }
        }}
      >
        <div className={cn(classNames.hint)} style={styles.hint}>
          {renderHtml({
            html: properties.title ?? 'Click or drag to add a file.',
            methods,
          })}
        </div>
      </Dragger>
    </div>
  );
};

export default withBlockDefaults(withTheme('Upload', UploadDragger));
