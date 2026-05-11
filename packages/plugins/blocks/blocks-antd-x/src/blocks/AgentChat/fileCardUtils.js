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

function getFileCardType(mediaType) {
  if (!mediaType) return 'file';
  if (mediaType.startsWith('image/')) return 'image';
  if (mediaType.startsWith('audio/')) return 'audio';
  if (mediaType.startsWith('video/')) return 'video';
  return 'file';
}

function getFileCardIcon(mediaType, filename) {
  if (!mediaType) return 'default';
  if (mediaType.startsWith('image/')) return 'image';
  if (mediaType.startsWith('audio/')) return 'audio';
  if (mediaType.startsWith('video/')) return 'video';
  if (mediaType === 'application/pdf') return 'pdf';
  if (mediaType === 'text/markdown' || filename?.endsWith('.md')) return 'markdown';
  if (mediaType.includes('zip') || mediaType.includes('compressed')) return 'zip';
  if (
    mediaType.includes('spreadsheet') ||
    mediaType.includes('excel') ||
    filename?.endsWith('.xlsx') ||
    filename?.endsWith('.xls') ||
    filename?.endsWith('.csv')
  ) {
    return 'excel';
  }
  if (mediaType.includes('presentation') || mediaType.includes('powerpoint')) return 'ppt';
  if (mediaType.includes('wordprocessing') || mediaType.includes('msword')) return 'word';
  if (mediaType === 'text/javascript' || mediaType === 'application/javascript')
    return 'javascript';
  if (mediaType === 'text/x-python' || mediaType === 'application/x-python') return 'python';
  if (mediaType === 'text/x-java-source') return 'java';
  return 'default';
}

function getFileName(part) {
  if (part.filename) return part.filename;
  if (part.url && !part.url.startsWith('data:')) {
    try {
      const pathname = new URL(part.url).pathname;
      const segments = pathname.split('/');
      const last = segments[segments.length - 1];
      if (last) return decodeURIComponent(last);
    } catch (e) {
      // ignore invalid URLs
    }
  }
  const ext = part.mediaType?.split('/')[1]?.split(';')[0] ?? '';
  return ext ? `file.${ext}` : 'Attachment';
}

export { getFileCardType, getFileCardIcon, getFileName };
