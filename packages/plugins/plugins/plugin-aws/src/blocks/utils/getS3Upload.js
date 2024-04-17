/*
  Copyright 2020-2024 Lowdefy, Inc

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

const getS3Upload =
  ({ methods, setFileList, setLoading = () => null }) =>
  async ({ file }) => {
    if (!file) {
      console.warn('File is undefined in useS3Upload');
      return;
    }
    try {
      setLoading(true);
      const { lastModified, name, size, type, uid } = file;
      const s3PostPolicyResponse = await methods.triggerEvent({
        name: '__getS3PostPolicy',
        event: { file: { name, lastModified, size, type, uid } },
      });

      if (s3PostPolicyResponse.success !== true) {
        throw new Error('S3 post policy request error.');
      }

      const { url, fields = {} } = s3PostPolicyResponse.responses.__getS3PostPolicy.response[0];
      const { bucket, key } = fields;
      file.bucket = bucket;
      file.key = key;
      file.percent = 20;

      const formData = new FormData();
      Object.keys(fields).forEach((field) => {
        formData.append(field, fields[field]);
      });
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = async (event) => {
        if (event.lengthComputable) {
          await setFileList({
            event: 'onProgress',
            file,
            percent: (event.loaded / event.total) * 80 + 20,
          });
        }
      };
      xhr.addEventListener('error', async () => {
        await setFileList({ event: 'onError', file });
      });
      xhr.addEventListener('loadend', async () => {
        await setFileList({ event: 'onSuccess', file });
        setLoading(false);
      });
      xhr.open('post', url);
      xhr.send(formData);
    } catch (error) {
      console.error(error);
      await setFileList({ event: 'onError', file });
    }
  };

export default getS3Upload;
