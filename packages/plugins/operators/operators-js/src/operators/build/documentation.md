<TITLE>
_env
</TITLE>

<METADATA>
env: Build
</METADATA>

<DESCRIPTION>
The `_env` operator retrieves values from environment variables during the build process. This operator is evaluated at build time, making environment-specific configuration available in your Lowdefy application without exposing sensitive values in your source code.

Environment variables can be used to configure different settings for development, staging, and production environments. The `_env` operator supports dot notation for accessing nested values in JSON-encoded environment variables.

> **Note**: Unlike `_secret`, which is evaluated at runtime on the server, `_env` is evaluated during the build process. This means the values are embedded in the built configuration. Use `_secret` for sensitive data that should not be included in the build output.
> </DESCRIPTION>

<SCHEMA>
```yaml
_env:
  type: string | object
  description: The key of the environment variable to retrieve, or an object with key and default.
  properties:
    key:
      type: string
      description: The environment variable key to retrieve.
    default:
      type: any
      description: A fallback value if the environment variable is not set.
    all:
      type: boolean
      description: If true, returns all environment variables as an object.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic environment variable retrieval

Retrieve a simple environment variable value.

```yaml
# Environment: API_BASE_URL=https://api.example.com
connections:
  - id: api
    type: AxiosHttp
    properties:
      baseURL:
        _env: API_BASE_URL
```

Returns: `"https://api.example.com"`

---

###### Example 2: Using a default value

Provide a fallback value when the environment variable might not be set.

```yaml
# Environment: DEBUG_MODE not set
config:
  debug:
    _env:
      key: DEBUG_MODE
      default: false
```

Returns: `false` when `DEBUG_MODE` is not defined.

---

###### Example 3: Configuring connections with environment variables

Set up a MongoDB connection using environment-specific credentials.

```yaml
connections:
  - id: main_database
    type: MongoDBCollection
    properties:
      collection: products
      databaseUri:
        _env: MONGODB_URI
      databaseName:
        _env:
          key: MONGODB_DATABASE
          default: app_development
```

---

###### Example 4: Feature flags and environment-specific settings

Configure feature toggles for different environments.

```yaml
global:
  features:
    enable_analytics:
      _env:
        key: ENABLE_ANALYTICS
        default: false
    maintenance_mode:
      _env:
        key: MAINTENANCE_MODE
        default: false
    max_upload_size:
      _env:
        key: MAX_UPLOAD_SIZE_MB
        default: 10

  api_endpoints:
    users_service:
      _env: USERS_SERVICE_URL
    notifications_service:
      _env: NOTIFICATIONS_SERVICE_URL
```

---

###### Example 5: Multi-environment configuration

Configure application settings that vary between development, staging, and production.

```yaml
# Environment variables differ per deployment:
# DEV:  APP_ENVIRONMENT=development, LOG_LEVEL=debug
# PROD: APP_ENVIRONMENT=production, LOG_LEVEL=error

name:
  _string.concat:
    - 'MyApp - '
    - _env:
        key: APP_ENVIRONMENT
        default: development

config:
  homePageId: home

auth:
  adapter:
    id: db_adapter
    type: MongoDBAdapter
    properties:
      databaseUri:
        _env: AUTH_DATABASE_URI

plugins:
  - name: '@lowdefy/plugin-monitoring'
    version: '1.0.0'
    properties:
      enabled:
        _env:
          key: MONITORING_ENABLED
          default: true
      logLevel:
        _env:
          key: LOG_LEVEL
          default: info
      endpoint:
        _env: MONITORING_ENDPOINT
```

</EXAMPLES>
