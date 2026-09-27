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

import net from 'node:net';
import { type } from '@lowdefy/helpers';

import parseIpRange from './parseIpRange.js';

// A dual-stack socket reports an IPv4 peer as "::ffff:203.0.113.7", and a
// proxy on one may forward it that way. Both come out in the IPv4 form, so
// logs and the session record carry one spelling of an address.
function unmapIpv4(address) {
  const mapped = /^::ffff:([\d.]+)$/i.exec(address);
  if (mapped !== null && net.isIP(mapped[1]) === 4) {
    return mapped[1];
  }
  return address;
}

// Some proxies write a hop with its port: "203.0.113.7:51234", "[2001:db8::1]:443".
function parseForwardedHop(hop) {
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(hop);
  if (bracketed !== null) {
    return net.isIP(bracketed[1]) === 6 ? unmapIpv4(bracketed[1]) : null;
  }
  if (net.isIP(hop) !== 0) {
    return unmapIpv4(hop);
  }
  const withPort = /^([\d.]+):\d+$/.exec(hop);
  if (withPort !== null && net.isIP(withPort[1]) === 4) {
    return withPort[1];
  }
  return null;
}

// The client address is the socket's peer unless that peer is a trusted proxy.
// A trusted proxy appends the address it received from to X-Forwarded-For, so
// the chain is read from the right: every trusted hop is skipped and the first
// untrusted one is the client. Entries to its left were written by whoever sent
// the request and are never believed. With no trusted proxies the header is not
// read at all - a client cannot choose its own address.
//
// trustedProxies holds IP addresses and CIDR ranges the build has validated.
function createClientAddressResolver({ trustedProxies }) {
  const trusted = new net.BlockList();
  (trustedProxies ?? []).forEach((entry) => {
    const { address, prefix, family } = parseIpRange(entry);
    trusted.addSubnet(address, prefix, family);
  });

  function isTrusted(address) {
    return trusted.check(address, net.isIP(address) === 6 ? 'ipv6' : 'ipv4');
  }

  return function resolveClientAddress({ peerAddress, forwardedFor }) {
    if (!type.isString(peerAddress) || net.isIP(peerAddress) === 0) {
      return null;
    }
    let address = unmapIpv4(peerAddress);
    if (!isTrusted(address) || !type.isString(forwardedFor)) {
      return address;
    }
    const hops = forwardedFor
      .split(',')
      .map((hop) => hop.trim())
      .filter((hop) => hop !== '');
    for (let index = hops.length - 1; index >= 0; index -= 1) {
      const hop = parseForwardedHop(hops[index]);
      // A malformed hop ends the walk at the last address a trusted proxy vouched for.
      if (hop === null) {
        return address;
      }
      address = hop;
      if (!isTrusted(address)) {
        return address;
      }
    }
    return address;
  };
}

export default createClientAddressResolver;
