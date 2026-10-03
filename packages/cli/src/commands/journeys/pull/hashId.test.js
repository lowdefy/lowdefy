import hashId from './hashId.js';

const salt = Buffer.alloc(32, 7);

test('hashId prefixes the first 16 hex characters of the HMAC', () => {
  const hash = hashId({ salt, id: 'person-1', prefix: 'p_' });
  expect(hash).toMatch(/^p_[0-9a-f]{16}$/);
  expect(hashId({ salt, id: 'person-1', prefix: 'p_' })).toBe(hash);
});

test('hashId gives different hashes under different salts', () => {
  expect(hashId({ salt, id: 'person-1', prefix: 'p_' })).not.toBe(
    hashId({ salt: Buffer.alloc(32, 8), id: 'person-1', prefix: 'p_' })
  );
});

test('hashId returns null for a missing id', () => {
  expect(hashId({ salt, id: null, prefix: 'o_' })).toBeNull();
  expect(hashId({ salt, id: undefined, prefix: 'o_' })).toBeNull();
  expect(hashId({ salt, id: '', prefix: 'o_' })).toBeNull();
});
