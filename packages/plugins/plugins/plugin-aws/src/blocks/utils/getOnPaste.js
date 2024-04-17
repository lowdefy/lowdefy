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

const getFileFromEvent = async (event) => {
  const items = event.clipboardData.items;
  for (const item of items) {
    if (item.kind === 'file') {
      return item.getAsFile();
    }
  }
};

const getFileFromNavigator = async () => {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    for (const type of item.types) {
      if (type === 'image/png' || type === 'image/jpeg') {
        const blob = await item.getType(type);
        return new File([blob], 'clipboard.png', { type: blob.type });
      }
    }
  }
};

const getOnPaste =
  ({ s3UploadRequest, properties }) =>
  async (event) => {
    event?.preventDefault?.();
    if (properties.disabled) return;
    const file = event ? await getFileFromEvent(event) : await getFileFromNavigator();
    if (!file) return;
    file.uid = `${properties.fileName ?? file.name ?? 'clipboard'}-${Date.now()}`;
    await s3UploadRequest({ file });
  };

export default getOnPaste;
