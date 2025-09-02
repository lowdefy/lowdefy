import { type } from '@lowdefy/helpers';
import crypto from 'crypto';

// Sort object keys to ensure stable stringification
function stableStringify(obj) {
  if (type.isObject(obj)) {
    return (
      '{' +
      Object.keys(obj)
        .sort()
        .map((k) => `"${k}":${stableStringify(obj[k])}`)
        .join(',') +
      '}'
    );
  }

  if (type.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }

  return JSON.stringify(obj);
}

export default function makeRefHash(refDef) {
  return crypto
    .createHash('sha1')
    .update(stableStringify(refDef) || '')
    .digest('base64');
}
