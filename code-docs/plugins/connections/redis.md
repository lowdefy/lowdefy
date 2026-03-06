# @lowdefy/connection-redis

[Redis](https://redis.io/docs/) connection for Lowdefy. Uses [ioredis](https://github.com/redis/ioredis) client.

## Connection Type

| Type    | Purpose          |
| ------- | ---------------- |
| `Redis` | Connect to Redis |

## Connection Configuration

```yaml
connections:
  - id: redis
    type: Redis
    properties:
      url:
        _secret: REDIS_URL
```

Or with separate options:

```yaml
connections:
  - id: redis
    type: Redis
    properties:
      host: localhost
      port: 6379
      password:
        _secret: REDIS_PASSWORD
```

## Request Types

| Type          | Purpose        |
| ------------- | -------------- |
| `RedisGet`    | Get value      |
| `RedisSet`    | Set value      |
| `RedisDelete` | Delete key     |
| `RedisExpire` | Set expiration |

## RedisGet

```yaml
requests:
  - id: getCached
    type: RedisGet
    connectionId: redis
    properties:
      key:
        _string:
          - 'user:'
          - _state: userId
```

## RedisSet

```yaml
requests:
  - id: setCache
    type: RedisSet
    connectionId: redis
    properties:
      key:
        _string:
          - 'session:'
          - _state: sessionId
      value:
        _state: sessionData
      ex: 3600 # Expire in 1 hour
```

## Use Cases

- Session storage
- Caching
- Rate limiting
- Real-time features
