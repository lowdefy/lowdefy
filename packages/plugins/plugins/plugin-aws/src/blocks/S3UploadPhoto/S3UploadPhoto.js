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
import { withBlockDefaults, renderHtml } from '@lowdefy/block-utils';

import { Upload } from 'antd';

import useFileList from '../utils/useFileList.js';
import getS3Upload from '../utils/getS3Upload.js';

const S3UploadPhoto = ({
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
  const s3UploadRequest = getS3Upload({ methods, setFileList, setLoading });

  useEffect(() => {
    methods.setValue({ file: null, fileList: [] });
    methods.registerEvent({
      name: '__getS3PostPolicy',
      actions: [
        {
          id: '__getS3PostPolicy',
          type: 'Request',
          params: [properties.s3PostPolicyRequestId],
        },
      ],
    });
  }, []);
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(state)) {
      setValue(value);
    }
  }, [value]);
  return (
    <Upload
      accept="image/*"
      beforeUpload={loadFileList}
      className="avatar-uploader"
      customRequest={s3UploadRequest}
      disabled={properties.disabled}
      fileList={state.fileList}
      id={blockId}
      listType="picture-card"
      maxCount={properties.maxCount}
      multiple={!properties.singleFile}
      onRemove={removeFile}
      showUploadList={properties.showUploadList}
      onChange={() => {
        methods.triggerEvent({ name: 'onChange' });
      }}
    >
      <div className={classNames.element} style={styles.element}>
        {loading ? (
          <Icon
            blockId={`${blockId}_icon`}
            classNames={{ element: classNames.icon }}
            events={events}
            properties={{ name: 'AiOutlineLoading', size: 24 }}
            styles={{ element: styles.icon }}
          />
        ) : (
          <Icon
            blockId={`${blockId}_icon`}
            classNames={{ element: classNames.icon }}
            events={events}
            properties={{ name: 'AiOutlineCamera', size: 24 }}
            styles={{ element: styles.icon }}
          />
        )}
        <div className={classNames.title} style={{ marginTop: 8, ...styles.title }}>
          {renderHtml({
            html: properties.title ?? 'Upload image',
            methods,
          })}
        </div>
      </div>
    </Upload>
  );
};

export default withBlockDefaults(S3UploadPhoto);
