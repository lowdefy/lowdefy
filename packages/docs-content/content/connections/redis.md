# Redis

[`Redis`](http://redis.io/) is an open-source, in-memory key-value data structure store. Redis offers a set of versatile in-memory data structures (strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams) that allow the creation of many custom applications. Key use cases for Redis include database, caching, session management and message broker.

Lowdefy integrates with Redis using the one of the recommended [Node.js clients (node-redis)](https://github.com/redis/node-redis).

## Connections

Connection types:
  - Redis

### Redis

#### Properties
- `connection: object | string `: __Required__ - Connection object or connection string to pass to the [`redis client`](https://github.com/redis/node-redis).

The connection object is passed to the redis client (node-redis 6) as is, so see its [configuration options](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md). Each request opens its own connection and closes it when the command completes. Lowdefy sets `socket.reconnectStrategy` to `false`, so a request fails straight away when Redis cannot be reached instead of waiting while the client retries. Set `socket.reconnectStrategy` to a number of milliseconds to retry instead.

The client talks to Redis with the RESP3 protocol, which needs Redis 6 or later. For an older Redis server, or to get the reply shapes the RESP2 protocol gives, set `RESP: 2` in the connection object.

#### Examples

###### Redis with connection object:
```yaml
connections:
  - id: redis
    type: Redis
    properties:
      connection:
        username:
          _secret: REDIS_USERNAME
        password:
          _secret: REDIS_PASSWORD
        database:
          _secret: REDIS_DATABASE
        socket:
          host:
            _secret: REDIS_HOST
          port:
            _secret: REDIS_PORT
```
Environment variables:
```
LOWDEFY_SECRET_REDIS_USERNAME = user
LOWDEFY_SECRET_REDIS_PASSWORD = password
LOWDEFY_SECRET_REDIS_DATABASE = 4
LOWDEFY_SECRET_REDIS_HOST = redis.server.com
LOWDEFY_SECRET_REDIS_PORT = 5000
```

###### Redis with connection string:
```yaml
connections:
  - id: redis
    type: Redis
    properties:
      connection:
        _secret: REDIS_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_REDIS_CONNECTION_STRING = redis://user:password@redis.server.com:5000/4
```

## Requests

Request types:
  - Redis

### Redis

#### Properties

- `command: string`: **Required** - Redis command to be executed, accepts all of the [out-of-the-box Redis commands](https://redis.io/commands). The command is the name of the node-redis client method, in any case. For most commands that is the Redis command name, but some variants have their own method, for example `ZRANGE_WITHSCORES` for `ZRANGE` with `WITHSCORES`, or `GEORADIUS_STORE` for `GEORADIUS` with `STORE`.
- `parameters: array`: An array of parameters to be passed to the redis command, in the order the node-redis client method takes them.
- `modifiers: object`: The options object to be passed to the redis command after the parameters. Its keys are upper-cased, so `nx: true` is sent as `NX: true`. For options whose node-redis names are not upper case, like `condition` or `expiration` on `SET`, pass the options object as the last item of `parameters` instead.

Replies are returned as the node-redis client returns them. For example `HGETALL` returns an object and `ZRANGE_WITHSCORES` returns an array of `{ value, score }` objects.

#### Examples

###### Setting a key-value pair in redis:

```yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: set
  parameters:
    - key
    - value
```

###### Getting a value from redis:

```yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: get
  parameters:
    - key
```

###### Setting a key-value pair only if key does not exist:

```yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: set
  parameters:
    - key
    - value
  modifiers:
    nx: true
```

###### Setting a key-value pair that expires after 60 seconds:

```yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: set
  parameters:
    - key
    - value
    - expiration:
        type: EX
        value: 60
```
