<TITLE>
_hash
</TITLE>

<METADATA>
env: Server Only
</METADATA>

<DESCRIPTION>
The `_hash` operator generates cryptographic hash digests using various algorithms. Hashing is a one-way function that converts input data into a fixed-size string of characters, commonly used for:

- Data integrity verification (checksums)
- Generating unique identifiers from content
- Creating signatures for webhooks
- Anonymizing sensitive data

**Available Methods:**

- `md5`: 128-bit hash (32 hex characters) - fast but not cryptographically secure
- `sha1`: 160-bit hash (40 hex characters) - legacy, use SHA-256 for new applications
- `sha256`: 256-bit hash (64 hex characters) - recommended for most use cases
- `sha512`: 512-bit hash (128 hex characters) - highest security
- `ripemd160`: 160-bit hash (40 hex characters) - used in cryptocurrency applications

> **Note**: For password hashing, use a dedicated password hashing library (like bcrypt) instead of these general-purpose hash functions.
> </DESCRIPTION>

<SCHEMA>
```yaml
_hash.md5:
  type: string
  description: The string to hash using MD5.
  returns: string (32 hex characters)

\_hash.sha1:
type: string
description: The string to hash using SHA-1.
returns: string (40 hex characters)

\_hash.sha256:
type: string
description: The string to hash using SHA-256.
returns: string (64 hex characters)

\_hash.sha512:
type: string
description: The string to hash using SHA-512.
returns: string (128 hex characters)

\_hash.ripemd160:
type: string
description: The string to hash using RIPEMD-160.
returns: string (40 hex characters)

````
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic SHA-256 hash generation
Create a hash of a simple string value.

```yaml
id: generate_content_hash
type: MongoDBUpdateOne
connectionId: documents
properties:
  filter:
    _id:
      _payload: document_id
  update:
    $set:
      content:
        _payload: content
      content_hash:
        _hash.sha256:
          _payload: content
      updated_at:
        _date: now
````

Stores both the content and its SHA-256 hash for integrity verification.

---

###### Example 2: Webhook signature verification

Validate incoming webhook requests using HMAC-like signatures.

```yaml
id: verify-webhook
type: Api
routine:
  - :set_state:
      received_signature:
        _payload: signature
      computed_signature:
        _hash.sha256:
          _string.concat:
            - _payload: timestamp
            - '.'
            - _json.stringify:
                _payload: body
            - '.'
            - _secret: WEBHOOK_SECRET

  - :if:
      _ne:
        - _state: received_signature
        - _state: computed_signature
    :then:
      - :reject:
          error: Invalid webhook signature
          status: 401

  - id: process_webhook
    type: MongoDBInsertOne
    connectionId: webhook_events
    properties:
      doc:
        payload:
          _payload: body
        verified: true
        received_at:
          _date: now

  - :return:
      success: true
```

---

###### Example 3: Generating cache keys

Create unique cache keys from request parameters.

```yaml
id: get-cached-data
type: Api
routine:
  - :set_state:
      cache_key:
        _hash.md5:
          _json.stringify:
            endpoint:
              _payload: endpoint
            params:
              _payload: params
            user_id:
              _user: id

  - id: check_cache
    type: MongoDBFindOne
    connectionId: cache
    properties:
      query:
        key:
          _state: cache_key
        expires_at:
          $gt:
            _date: now

  - :if:
      _step: check_cache
    :then:
      - :return:
          cached: true
          data:
            _step: check_cache.data

  - id: fetch_fresh_data
    type: AxiosHttp
    connectionId: external_api
    properties:
      url:
        _payload: endpoint
      params:
        _payload: params

  - id: store_cache
    type: MongoDBUpdateOne
    connectionId: cache
    properties:
      filter:
        key:
          _state: cache_key
      update:
        $set:
          key:
            _state: cache_key
          data:
            _step: fetch_fresh_data
          expires_at:
            _date.add:
              - _date: now
              - 1
              - hour
      options:
        upsert: true

  - :return:
      cached: false
      data:
        _step: fetch_fresh_data
```

---

###### Example 4: Content deduplication

Identify duplicate content using hashes.

```yaml
id: upload-file
type: Api
routine:
  - :set_state:
      content_hash:
        _hash.sha256:
          _payload: file_content

  - id: check_duplicate
    type: MongoDBFindOne
    connectionId: files
    properties:
      query:
        content_hash:
          _state: content_hash

  - :if:
      _step: check_duplicate
    :then:
      - :return:
          duplicate: true
          existing_file_id:
            _step: check_duplicate._id
          message: File with identical content already exists

  - id: save_file
    type: MongoDBInsertOne
    connectionId: files
    properties:
      doc:
        filename:
          _payload: filename
        content:
          _payload: file_content
        content_hash:
          _state: content_hash
        size:
          _string.length:
            _payload: file_content
        uploaded_by:
          _user: id
        uploaded_at:
          _date: now

  - :return:
      duplicate: false
      file_id:
        _step: save_file.insertedId
```

---

###### Example 5: Multi-algorithm hashing for audit trails

Generate multiple hash formats for comprehensive audit logging.

```yaml
id: create-audit-record
type: Api
routine:
  - :set_state:
      audit_data:
        _json.stringify:
          action:
            _payload: action
          resource:
            _payload: resource
          user_id:
            _user: id
          timestamp:
            _date: now
          ip_address:
            _payload: ip_address

  - id: insert_audit_record
    type: MongoDBInsertOne
    connectionId: audit_log
    properties:
      doc:
        action:
          _payload: action
        resource:
          _payload: resource
        user_id:
          _user: id
        timestamp:
          _date: now
        ip_address:
          _payload: ip_address
        hashes:
          md5:
            _hash.md5:
              _state: audit_data
          sha1:
            _hash.sha1:
              _state: audit_data
          sha256:
            _hash.sha256:
              _state: audit_data
          sha512:
            _hash.sha512:
              _state: audit_data
        data_snapshot:
          _state: audit_data

  - :log:
      audit_record_created:
        id:
          _step: insert_audit_record.insertedId
        sha256:
          _hash.sha256:
            _state: audit_data

  - :return:
      audit_id:
        _step: insert_audit_record.insertedId
      verification_hash:
        _hash.sha256:
          _state: audit_data
```

</EXAMPLES>
