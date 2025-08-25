import crypto from 'crypto';

export default function makeRefHash(refDef) {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(refDef) || '')
    .digest('base64');
}
