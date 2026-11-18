---
'@lowdefy/connection-redis': major
---

fix(deps)!: Update redis (node-redis) to 6.3.1

The Redis connection moves from node-redis 4 to node-redis 6. Some replies change shape, the client now uses the RESP3 protocol, and a few connection options are renamed. Your app is affected if it has a `Redis` connection and either its connection config or its requests use any of the items below. Search your config for `type: Redis` and check each request's `command` against the list.

**Redis server version.** The client now speaks RESP3, which needs Redis 6 or later. On Redis 5 or older every request fails when it connects. Add `RESP: 2` to the connection object to keep using RESP2:

```yaml
connections:
  - id: redis
    type: Redis
    properties:
      connection:
        RESP: 2
        socket:
          host: redis.example.com
```

**Replies that change shape** (node-redis 5 and 6):

- These return `0` or `1` instead of `false` or `true`: `COPY`, `EXPIRE`, `EXPIREAT`, `PEXPIRE`, `PEXPIREAT`, `HEXISTS`, `HSETNX`, `MOVE`, `PFADD`, `RENAMENX`, `SETNX`, `SISMEMBER`, `SMOVE`, `XACK`, `XGROUP_CREATECONSUMER`, `XGROUP_DESTROY`. `SMISMEMBER` and `SCRIPT_EXISTS` return arrays of `0`/`1`. A condition such as `_eq: [_request: setFlag, true]` is now always false; compare with `1` instead.
- `TIME` returns `[seconds, microseconds]` as two strings instead of a date. `LASTSAVE` returns a Unix timestamp number instead of a date.
- `SCAN`, `HSCAN`, `SSCAN` and `ZSCAN` return `cursor` as a string instead of a number. `HSCAN` returns its field/value pairs as `entries` instead of `tuples`.
- `GEOSEARCH_WITH`, `GEORADIUS_WITH`, `GEORADIUSBYMEMBER_WITH` (and their `_RO` forms) return `distance`, `coordinates.longitude` and `coordinates.latitude` as numbers instead of strings.
- `HRANDFIELD_COUNT_WITHVALUES` returns an array of `{ field, value }` instead of an object. `ZMPOP` returns `{ key, members: [{ value, score }] }` instead of `{ key, elements: [{ member, score }] }`. `LCS_IDX` returns `len` instead of `length`, and each match as a `[key1, key2]` pair.
- `XINFO_STREAM`, `XINFO_GROUPS`, `FUNCTION_STATS`, `MEMORY_STATS`, `MODULE_LIST` and `CLUSTER_LINKS` replies keep the key names Redis sends instead of camelCasing them, for example `last-delivered-id` instead of `lastDeliveredId`, and `ver` instead of `version` in `MODULE_LIST`.

**Command arguments that change** (node-redis 5):

- `ZINTER`, `ZINTER_WITHSCORES`, `ZUNION` and `ZUNION_WITHSCORES` ignore a `weights` modifier. Pass the weights with the keys as the first parameter instead: `[{ key: a, weight: 1 }, { key: b, weight: 2 }]`.
- `ZADD` ignores an `incr` modifier. Use the `ZADD_INCR` command instead.
- `GEORADIUSSTORE` and `GEORADIUSBYMEMBERSTORE` are now `GEORADIUS_STORE` and `GEORADIUSBYMEMBER_STORE`. The old names fail with `Invalid redis command`.
- `COPY` now takes `db` and `replace` modifiers. The node-redis 4 names (`destinationDb`, `replace`) did not work through the connection, since it upper-cases modifier keys.

**Connection options that change**:

| node-redis 4 (your connection config) | node-redis 6                                                      |
| ------------------------------------- | ----------------------------------------------------------------- |
| `socket.keepAlive: 5000`              | `socket.keepAlive: true` and `socket.keepAliveInitialDelay: 5000` |
| `socket.keepAlive: false`             | unchanged                                                         |
| `legacyMode`                          | removed, the Redis connection never worked with it                |
| `isolationPoolOptions`                | removed, each Lowdefy request opens its own connection            |

A numeric `socket.keepAlive` no longer sets the delay: it turns keep-alive on with the new default delay of 30 seconds.

**New default command timeout.** node-redis 6 rejects a command that has waited 5 seconds to be sent (`commandOptions.timeout`). The timer stops once the command is written to Redis, so it does not cut off a slow command or a blocking one such as `BLPOP` with a long wait. Since a Lowdefy request connects before it sends its command, this only fires when the connection stalls. Set `commandOptions: { timeout: 0 }` on the connection to turn it off.

**Connection failures.** A request still fails as soon as it cannot connect to Redis: the connection now sets `socket.reconnectStrategy: false` instead of throwing from the client's error event, which could crash the server when a connection dropped after connecting. Set `socket.reconnectStrategy` to a number of milliseconds to retry instead.

Other changes:

- The connection now requires its `connection` property. The schema meant to require it but misspelled the keyword, so a connection without one used to connect to `localhost:6379`; now the build fails with `Redis connection should have required property "connection".` Add `connection: redis://localhost:6379` if you relied on that.
- With RESP3, the client also asks Redis Enterprise for maintenance notifications (`maintNotifications: auto`). Other Redis servers ignore it. Set `maintNotifications: disabled` to turn it off.
- `RESP: 2` brings back the RESP2 shapes of node-redis 5 (the geo values above go back to strings) but not the node-redis 4 shapes in the lists above.
- The full migration notes are in node-redis's [v4 to v5](https://github.com/redis/node-redis/blob/master/docs/v4-to-v5.md) and [v5 to v6](https://github.com/redis/node-redis/blob/master/docs/v5-to-v6.md) guides.
