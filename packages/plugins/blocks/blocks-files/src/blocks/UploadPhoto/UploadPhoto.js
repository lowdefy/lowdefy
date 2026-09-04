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

import React, { useEffect, useState } from 'react';
import { blockRootProps, cn, renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

import { Upload as AntdUpload } from 'antd';

import useFileList from '../utils/useFileList.js';
import getEmitFileContent from '../utils/getEmitFileContent.js';
import getUploadRequest from '../utils/getUploadRequest.js';
import withTheme from '../../withTheme.js';

const UploadPhoto = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  methods,
  properties,
  styles = {},
  value,
}) => {
  const [state, loadFileList, setFileList, removeFile, setValue] = useFileList({
    properties,
    methods,
    value,
  });
  const [loading, setLoading] = useState(false);
  const emitFileContent = properties.emitFileContent === true;
  const uploadRequest = emitFileContent
    ? getEmitFileContent({ methods, setFileList, setLoading })
    : getUploadRequest({ methods, setFileList, setLoading });

  useEffect(() => {
    methods.setValue({ file: null, fileList: [] });
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
  return (
    <div {...blockRootProps({ blockId, classNames, styles, className: 'lf-upload-photo' })}>
      <AntdUpload
        accept="image/*"
        beforeUpload={loadFileList}
        classNames={{
          trigger: classNames.trigger,
          list: classNames.list,
          item: classNames.item,
        }}
        styles={{
          trigger: styles.trigger,
          list: styles.list,
          item: styles.item,
        }}
        customRequest={uploadRequest}
        disabled={properties.disabled}
        fileList={state.fileList}
        listType="picture-card"
        maxCount={properties.maxCount}
        multiple={!properties.singleFile}
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
        <div className="lf-upload-photo-content">
          <Icon
            blockId={`${blockId}_icon`}
            classNames={{ element: cn('lf-upload-photo-icon', classNames.icon) }}
            events={events}
            properties={{
              name: loading ? 'AiOutlineLoading' : 'AiOutlineCamera',
              size: 24,
            }}
            styles={{ element: styles.icon }}
          />
          <div
            className={cn('lf-upload-photo-title', classNames.title)}
            style={{ marginTop: 8, ...styles.title }}
          >
            {renderHtml({
              html: properties.title ?? 'Upload image',
              methods,
            })}
          </div>
        </div>
      </AntdUpload>
    </div>
  );
};

export default withBlockDefaults(withTheme('Upload', UploadPhoto));
