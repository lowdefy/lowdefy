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

/**
 * The one place image bytes are acquired for a report. Every `image` node — the
 * `Img` block, markdown images — routes through `resolveImage`, so the
 * acquisition rules and the security guardrails live in a single module ("one
 * correct way"). A resolver never throws: any failure logs a warning and returns
 * `null`, and the caller skips that image so the report still renders.
 *
 * Three source kinds are supported:
 *   - `data:` URIs decode directly (the mime must be `image/*`).
 *   - Relative paths (`/logo.png`) are made absolute against the app's own
 *     `origin` and fetched — public assets are served at `origin` on every
 *     deployment (dev, Docker, Vercel CDN), whereas the raw `public/` folder is
 *     on disk in none of the server functions. Because this URL is the app
 *     itself, it is exempt from the private-address refusal below: a self-hosted
 *     `origin` may legitimately be an internal address.
 *   - Absolute `http(s)` URLs fetch with SSRF guardrails: the host must not
 *     resolve to a private, loopback, or link-local address; redirects are
 *     refused rather than followed; the request times out after 5s; the body is
 *     capped at 5 MB; the response content-type must be `image/*`. The private
 *     -address guard always applies to an author-supplied absolute URL, even one
 *     that points back at `origin`.
 *
 * Not guarded: DNS rebinding. A hostname is resolved here to judge its addresses
 * and then resolved again, independently, by `fetch` — a record that changes
 * between the two connects to an address this module never saw. Closing that
 * needs the connection pinned to the address that was checked, which `fetch`
 * cannot express; it would mean dropping to `node:https` and carrying the
 * redirect, timeout and streaming rules by hand. The exposure is narrow (the
 * attacker must control both the `src` and a DNS zone), so the trade is stated
 * here rather than paid for.
 */

import dns from 'node:dns/promises';
import net from 'node:net';

const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Strip a query string (and fragment) so logged sources leak no secrets. */
function redact(src) {
  if (typeof src !== 'string') return String(src);
  if (src.startsWith('data:')) return 'data:<redacted>';
  return src.split(/[?#]/)[0];
}

function warn(logger, src, reason) {
  logger?.warn?.({ src: redact(src) }, `Report image skipped: ${reason} (src '${redact(src)}').`);
}

// --- Private-address guard ---------------------------------------------------
// Refuse addresses in the ranges an SSRF probe would target: 10/8, 172.16/12,
// 192.168/16, 127/8 (loopback), 169.254/16 (link-local, and so the cloud
// metadata service), 0/8, ::/96 and ::ffff:0:0/96 and 64:ff9b::/96 (all of which
// embed an IPv4 address), fc00::/7 (unique-local) and fe80::/10 (link-local).
//
// An IPv6 address is normalised to its 16 bytes before being judged, never
// matched as text. `URL` rewrites a host into its own canonical form, so the
// spelling a text guard looks for is not the spelling it gets: the mapped
// loopback `::ffff:127.0.0.1` arrives as `::ffff:7f00:1`, which a dotted-quad
// pattern cannot match, and it reached 127.0.0.1. Bytes have one spelling.

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // unparseable — refuse rather than risk it
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
}

/**
 * The 16 bytes of an IPv6 address, or `null` when it does not parse. Handles the
 * `::` run, a trailing dotted-quad, and a `%zone` suffix.
 */
function ipv6Bytes(ip) {
  let text = ip.toLowerCase();
  // A zone index (fe80::1%eth0) names a local interface, not part of the address.
  const zone = text.indexOf('%');
  if (zone !== -1) text = text.slice(0, zone);

  // A trailing dotted-quad (::ffff:127.0.0.1) is two hextets written the other way.
  const dotted = text.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) {
    const octets = dotted[1].split('.').map(Number);
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
    text =
      text.slice(0, -dotted[1].length) +
      [
        ((octets[0] << 8) | octets[1]).toString(16),
        ((octets[2] << 8) | octets[3]).toString(16),
      ].join(':');
  }

  const [head, tail, ...extra] = text.split('::');
  if (extra.length > 0) return null; // more than one '::' run
  const hextetsOf = (part) => (part === '' ? [] : part.split(':'));
  const left = hextetsOf(head);
  const right = tail === undefined ? [] : hextetsOf(tail);
  const filled = 8 - left.length - right.length;
  // Without a '::' run every hextet must be written out; with one, at least one
  // must be elided.
  if (tail === undefined ? filled !== 0 : filled < 0) return null;
  const hextets = [...left, ...Array(filled).fill('0'), ...right];

  const bytes = new Uint8Array(16);
  for (let index = 0; index < 8; index += 1) {
    if (!/^[0-9a-f]{1,4}$/.test(hextets[index])) return null;
    const value = Number.parseInt(hextets[index], 16);
    bytes[index * 2] = value >> 8;
    bytes[index * 2 + 1] = value & 0xff;
  }
  return bytes;
}

const isZero = (bytes, from, to) => bytes.subarray(from, to).every((byte) => byte === 0);

function isPrivateIPv6(ip) {
  const bytes = ipv6Bytes(ip);
  if (!bytes) return true; // unparseable — refuse rather than risk it

  // Three ranges carry an IPv4 address in their low four bytes: IPv4-mapped
  // (::ffff:0:0/96), the deprecated IPv4-compatible (::/96, which is also how
  // loopback `::1` and the unspecified `::` land here), and NAT64 (64:ff9b::/96).
  // Each is a route to that address, so judge it as the address it carries.
  const embedsIPv4 =
    (isZero(bytes, 0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) ||
    isZero(bytes, 0, 12) ||
    (bytes[0] === 0x00 &&
      bytes[1] === 0x64 &&
      bytes[2] === 0xff &&
      bytes[3] === 0x9b &&
      isZero(bytes, 4, 12));
  if (embedsIPv4) return isPrivateIPv4(bytes.slice(12).join('.'));

  if ((bytes[0] & 0xfe) === 0xfc) return true; // fc00::/7 — unique-local
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true; // fe80::/10 — link-local
  return false;
}

/** True when `ip` (a literal address) is in a refused range. */
function isPrivateAddress(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) return isPrivateIPv6(ip);
  return true; // not a valid literal — refuse
}

/**
 * Resolve `host` to addresses and report whether any is private. A literal IP
 * is checked directly (no DNS). A hostname is looked up; a lookup failure, or
 * any resolved address in a refused range, counts as private so the caller
 * refuses before opening a connection.
 */
async function hostResolvesPrivate(hostname) {
  // `URL.hostname` keeps the brackets around an IPv6 literal; strip them so
  // `net.isIP` recognises the address.
  const host = hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) !== 0) {
    return isPrivateAddress(host);
  }
  let records;
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    return true; // cannot resolve — refuse
  }
  if (records.length === 0) return true;
  return records.some((record) => isPrivateAddress(record.address));
}

// --- Source handlers ---------------------------------------------------------

function resolveDataUri(src, logger) {
  // data:[<mediatype>][;base64],<data>
  const comma = src.indexOf(',');
  if (comma === -1) {
    warn(logger, src, 'malformed data URI');
    return null;
  }
  const meta = src.slice(5, comma);
  const data = src.slice(comma + 1);
  const isBase64 = /;base64$/i.test(meta);
  const mime = (isBase64 ? meta.slice(0, -7) : meta).split(';')[0].trim().toLowerCase();
  if (!mime.startsWith('image/')) {
    warn(logger, src, `data URI mime '${mime || 'text/plain'}' is not an image`);
    return null;
  }
  try {
    const buffer = isBase64
      ? Buffer.from(data, 'base64')
      : Buffer.from(decodeURIComponent(data), 'utf8');
    if (buffer.length === 0) {
      warn(logger, src, 'data URI decoded to zero bytes');
      return null;
    }
    return { buffer, mime };
  } catch {
    warn(logger, src, 'data URI failed to decode');
    return null;
  }
}

async function readCapped(body, src, logger) {
  const chunks = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.length;
    if (total > MAX_BYTES) {
      warn(logger, src, `response exceeded the ${MAX_BYTES}-byte cap`);
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

/**
 * Fetch an absolute `http(s)` URL under the report guardrails. `skipPrivateGuard`
 * is set only for the app's own `origin` (relative asset paths) — an address the
 * app is allowed to reach even when it is internal; every other guard still runs.
 */
async function resolveRemote(url, src, logger, { skipPrivateGuard = false } = {}) {
  if (!skipPrivateGuard && (await hostResolvesPrivate(url.hostname))) {
    warn(logger, src, 'host resolves to a private, loopback, or link-local address');
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'error' });
    if (!response.ok) {
      warn(logger, src, `fetch returned HTTP ${response.status}`);
      return null;
    }
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      warn(logger, src, `content-type '${contentType || 'unknown'}' is not an image`);
      return null;
    }
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BYTES) {
      warn(logger, src, `declared content-length ${declared} exceeds the ${MAX_BYTES}-byte cap`);
      return null;
    }
    if (!response.body) {
      warn(logger, src, 'response had no body');
      return null;
    }
    const buffer = await readCapped(response.body, src, logger);
    if (buffer === null) return null;
    const mime = contentType.split(';')[0].trim();
    return { buffer, mime };
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'request timed out' : 'fetch failed';
    warn(logger, src, reason);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Acquire image bytes for one `src`.
 *
 * @param {object} params
 * @param {string} params.src A `data:` URI, a relative public-asset path
 *   (`/logo.png`), or an absolute `http(s)` URL.
 * @param {string} [params.origin] The app's own origin (e.g.
 *   `https://app.example.com`), server-injected. Relative paths are made
 *   absolute against it and fetched; the fetch is exempt from the private
 *   -address refusal because the target is the app itself.
 * @param {object} [params.logger] Pino-style logger; a warning is logged on
 *   every failure.
 * @returns {Promise<{ buffer: Buffer, mime: string } | null>} the bytes and
 *   their mime, or `null` when the image could not be acquired.
 */
export async function resolveImage({ src, origin, logger } = {}) {
  if (typeof src !== 'string' || src.trim() === '') {
    warn(logger, src, 'source is empty');
    return null;
  }
  const trimmed = src.trim();
  if (trimmed.startsWith('data:')) {
    return resolveDataUri(trimmed, logger);
  }
  if (/^https?:\/\//i.test(trimmed)) {
    let url;
    try {
      url = new URL(trimmed);
    } catch {
      warn(logger, src, 'invalid URL');
      return null;
    }
    return resolveRemote(url, trimmed, logger);
  }
  // Relative path — resolve against the app's own origin and fetch it there.
  if (!origin) {
    warn(logger, src, 'no origin available to resolve a relative image path');
    return null;
  }
  let url;
  try {
    url = new URL(trimmed, origin);
  } catch {
    warn(logger, src, 'relative path could not be resolved against origin');
    return null;
  }
  return resolveRemote(url, trimmed, logger, { skipPrivateGuard: true });
}

export default resolveImage;
