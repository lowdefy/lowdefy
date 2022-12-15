# Lowdefy S3 Upload Blocks

To securely upload files to S3, the `S3UploadButton` or `S3UploadPhoto` blocks can be used. S3 file downloads can be done by getting a presigned URL using a `AwsS3PresignedGetObject` request and opening the URL in a new tab which will result in the browser starting the file download.

To access the [Amazon S3 API](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html), a `AwsS3Bucket` connection is defined, and a `AwsS3PresignedPostPolicy` or `AwsS3PresignedGetObject` requests can be used to either upload or download files to S3.

### AwsS3Bucket Connection
The `AwsS3Bucket` connenction provides functionality of the [Amazon S3 API](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html).

##### Properties
- `accessKeyId: string`: AWS IAM access key id with s3 access.
- `secretAccessKey:  string` : AWS IAM secret access key with s3 access.
- `region:  string`: AWS region the bucket is located in
- `bucket:  string`: S3 bucket name.
- `read: boolean` : Allow reads from the bucket.
- `write: boolean`: Allow writes to the bucket.

### AwsS3PresignedPostPolicy File Upload Request
To upload files, a request of type `AwsS3PresignedPostPolicy` is used.

##### Properties
- `acl: string`: Access control lists used to grant read and write access.
- `conditions: array`: Conditions to be enforced on the request.
- `expires: number`: Number of seconds for which the policy should be valid.
- `key: string`: Key under which object will be stored.

### AwsS3PresignedGetObject File Download Request
To download files, a request of type `AwsS3PresignedGetObject` is used.

##### Properties
- `expires: number`: Number of seconds for which the policy should be valid.
- `key: string`: Key under which object is stored .
- `responseContentDisposition: string`: Sets the Content-Disposition header of the response.
- `responseContentType: string`: Sets the Content-Type header of the response.
- `versionId: string`: VersionId used to reference a specific version of the object.

### S3UploadButton and S3UploadPhoto Blocks

##### Properties
- `accept: string`: File types accepted by the input. See html file type input accept property at [https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept).
- `button: object`: Button block properties.
- `disabled: boolean`: Disable the file input.
- `s3PostPolicyRequestId: string`: Id of a request of type AwsS3PresignedPostPolicy that defines to which S3 bucket and how the file should be uploaded.
- `showUploadList: boolean`: Whether to show default upload list.
- `singleFile: boolean`: Only allow a single file to be uploaded. Only one file can be selected in the prompt and the upload button is disabled after a file is uploaded.

##### Events
- `onChange`: Triggered when the upload state is changing.
- `onClick`: Triggered when the upload button is clicked.
- `onSuccess`: Triggered when the upload is successful, returns `_event` object:
  - `meta`:
    - `bucket`: Name of bucket that the file was stored in.
    - `filename`: Uploaded filename.
    - `key`: Key under which the file is stored.
    - `size`: Size of uploaded file.
    - `type`: Type of uploaded file.
    - `uid`: UID of uploaded file.
- `onDone`: Triggered when the upload is completed, returns `_event` object:
  - `meta`:
    - `bucket`: Name of bucket that the file was stored in.
    - `filename`: Uploaded filename.
    - `key`: Key under which the file is stored.
    - `size`: Size of uploaded file.
    - `type`: Type of uploaded file.
    - `uid`: UID of uploaded file.
- `onError`: Triggered when an error occurs, returns `_event` object:
  - `meta`:
    - `bucket`: Name of bucket that the file was stored in.
    - `filename`: Uploaded filename.
    - `key`: Key under which the file is stored.
    - `size`: Size of uploaded file.
    - `type`: Type of uploaded file.
    - `uid`: UID of uploaded file.

### Examples

1. File Upload and Download:

  ```yaml
  # .env secrets needed
  LOWDEFY_SECRET_UPLOADS_S3_ACCESS_KEY_ID
  LOWDEFY_SECRET_UPLOADS_S3_SECRET_ACCESS_KEY
  LOWDEFY_SECRET_UPLOADS_S3_BUCKET
  ```

  ```yaml
  # lowdefy.yaml
  ...

  connections:
    - id: uploads_bucket
      type: AwsS3Bucket
      properties:
        accessKeyId:
          _secret: UPLOADS_S3_ACCESS_KEY_ID
        secretAccessKey:
          _secret: UPLOADS_S3_SECRET_ACCESS_KEY
        region: af-south-1
        bucket:
          _secret: UPLOADS_S3_BUCKET
        write: true

  pages:
    - id: s3_example_file_upload
      type: PageHeaderMenu
      properties:
        title: S3 Example File Upload
      layout:
        contentGutter: 16

      events:
        onMount:
          - id: set_state
            type: SetState
            params:
              files: []

      requests:
        - id: upload_file
          type: AwsS3PresignedPostPolicy
          connectionId: uploads_bucket
          payload:
            key:
              _state: file_uploader.file.name
          properties:
            key:
              _payload: key
        - id: download_file
          type: AwsS3PresignedGetObject
          connectionId: uploads_bucket
          payload:
            key:
              _state: selected.key
            responseContentType:
              _state: selected.type
          properties:
            key:
              _payload: key
            responseContentType:
              _payload: responseContentType

      blocks:
        - id: file_uploader_card
          type: Card
          properties:
            title: Upload Files
          blocks:
            - id: file_uploader
              type: S3UploadButton
              properties:
                s3PostPolicyRequestId: upload_file
                button:
                  title: Upload
              events:
                onSuccess:
                  - id: set_state
                    type: SetState
                    params:
                      files:
                        _array.concat:
                          - _state: files
                          - - _event: meta

        - id: file_card
          type: Card
          properties:
            title: Files
          blocks:
            - id: files_table
              type: AgGridAlpine
              properties:
                enableCellTextSelection: true
                rowData:
                  _state: files
                defaultColDef:
                  sortable: true
                  resizable: true
                  filter: true
                columnDefs:
                  - headerName: filename
                    field: filename
                  - headerName: size
                    field: size
                  - headerName: type
                    field: type
              events:
                onRowClick:
                  - id: set_selected_id
                    type: SetState
                    params:
                      selected:
                        _event: row
                  - id: download_file
                    type: Request
                    params: download_file
                  - id: get_download_link
                    type: Link
                    messages:
                      error: Failed to open file. Check if popups are blocked in your browser.
                    params:
                      url:
                        _request: download_file
                      newTab: true
  ```

2. Photo Upload and Download:

  ```yaml
  # .env secrets needed
  LOWDEFY_SECRET_UPLOADS_S3_ACCESS_KEY_ID
  LOWDEFY_SECRET_UPLOADS_S3_SECRET_ACCESS_KEY
  LOWDEFY_SECRET_UPLOADS_S3_BUCKET
  ```

  ```yaml
  # lowdefy.yaml
  ...
  connections:
    - id: uploads_bucket
      type: AwsS3Bucket
      properties:
        accessKeyId:
          _secret: UPLOADS_S3_ACCESS_KEY_ID
        secretAccessKey:
          _secret: UPLOADS_S3_SECRET_ACCESS_KEY
        region: af-south-1
        bucket:
          _secret: UPLOADS_S3_BUCKET
        write: true

  pages:
    - id: s3_example_photo_upload
      type: PageHeaderMenu
      properties:
        title: S3 Example Photo Upload
      layout:
        contentGutter: 16

      events:
        onMount:
          - id: set_state
            type: SetState
            params:
              files: []

      requests:
        - id: upload_file
          type: AwsS3PresignedPostPolicy
          connectionId: uploads_bucket
          payload:
            key:
              _state: file_uploader.file.name
          properties:
            key:
              _payload: key
        - id: download_file
          type: AwsS3PresignedGetObject
          connectionId: uploads_bucket
          payload:
            key:
              _state: selected.key
            responseContentType:
              _state: selected.type
          properties:
            key:
              _payload: key
            responseContentType:
              _payload: responseContentType

      blocks:
        - id: file_uploader_card
          type: Card
          properties:
            title: Upload Files
          blocks:
            - id: file_uploader
              type: S3UploadPhoto
              properties:
                s3PostPolicyRequestId: upload_file
                button:
                  title: Upload
              events:
                onSuccess:
                  - id: set_state
                    type: SetState
                    params:
                      files:
                        _array.concat:
                          - _state: files
                          - - _event: meta

        - id: file_card
          type: Card
          properties:
            title: Files
          blocks:
            - id: files_table
              type: AgGridAlpine
              properties:
                enableCellTextSelection: true
                rowData:
                  _state: files
                defaultColDef:
                  sortable: true
                  resizable: true
                  filter: true
                columnDefs:
                  - headerName: filename
                    field: filename
                  - headerName: size
                    field: size
                  - headerName: type
                    field: type
              events:
                onRowClick:
                  - id: set_selected_id
                    type: SetState
                    params:
                      selected:
                        _event: row
                  - id: download_file
                    type: Request
                    params: download_file
                  - id: get_download_link
                    type: Link
                    messages:
                      error: Failed to open file. Check if popups are blocked in your browser.
                    params:
                      url:
                        _request: download_file
                      newTab: true
  ```
