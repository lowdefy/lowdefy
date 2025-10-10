<TITLE>
Redis
</TITLE>

<DESCRIPTION>

[`Redis`](http://redis.io/) is an open-source, in-memory key-value data structure store. Redis offers a set of versatile in-memory data structures (strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams) that allow the creation of many custom applications. Key use cases for Redis include database, caching, session management and message broker.

Lowdefy integrates with Redis using the one of the recommended [Node.js clients (node-redis)](https://github.com/redis/node-redis).

### Properties

- `connection: object | string`: __Required__ - Connection object or string to pass to the [`redis client`](https://github.com/redis/node-redis) redis client.

The connection object accepts will be passed to the redis client verbatim, so check out the [configuration instructions](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md).

</DESCRIPTION>

<REQUESTS>

- Redis

</REQUESTS>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Redis',
  type: 'object',
  properties: {
    connection: {
      type: ['string', 'object'],
      description: 'Connection object or string to pass to the redis client.',
      errorMessage: {
        type: 'Redis connection property "connection" should be a string or object.',
      },
    },
  },
  require: ['connection'],
  errorMessage: {
    type: 'Redis connection properties should be an object.',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Redis with connection object

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

### Redis with connection string

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
LOWDEFY_SECRET_REDIS_CONNECTION_STRING = redis://user:password@redis:server.com:5000/4'
```

</EXAMPLES>
