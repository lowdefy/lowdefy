# Building Forms in Lowdefy

## Pt. 2: Connections & Requests

Lowdefy's input blocks have excellent functionality out of the box, but a large part of what makes Lowdefy so powerful is Connections.

Lowdefy apps can integrate with other services like APIs or databases using Connections and Requests.

Connections configure the settings to the external service, and often contain parameters like connection strings, URLs and secrets like passwords or API keys.

Requests are used to interact with the connection, such as inserting a data record, executing a query or calling an API end-point.

File management is a great example to illustrate the power of Connections in Lowdefy.

## File Management

In addition to general text input, users may need to upload files.

Whether to provide a scan of an identity document or a signed PDF document, it is important that your forms are able to handle these requirements.

Lowdefy features blocks with Amazon S3 integration to store files uploaded by users.

## Amazon S3

Amazon Web Services (AWS) provides a data storage solution called S3.

Lowdefy's AWS S3 Connection allows the user to upload and download files and data from S3 directly within the browser.

### Buckets

Files and data in S3 are stored as objects in collections called "buckets".

In order to add an AWS Connection to your app, you will need an S3 bucket to connect to.
[Our docs](https://docs.lowdefy.com/AWSS3) provide detailed instructions to create and AWS account and set up your first bucket.

Note that the links expire after a certain amount of time for added security.

### Requests

Objects can be accessed and stored in S3 using web requests.

Lowdefy's integration with S3 uses presigned links, which allow access to private objects and the creation of new objects.

Lowdefy has two types of Requests to facilitate this:

1. `AwsS3PresignedGetObject`, which is used to get a download link for an object in S3.

2. `AwsS3PresignedPostPolicy`, which is used to create a policy to allow file upload to S3.

## S3UploadButton

Lowdefy's file upload blocks include upload buttons, drag & drop dialog boxes, and image upload fields.

These blocks provide the standard UI and UX that users are familiar with.

The S3UploadButton opens the file system dialog when clicked, and is presented as a button with an icon and "Upload" text.

```yaml ldf
_ref: pages/blog/categories/forms/file-upload/upload-button.yaml
```

It is a very compact block, taking up little space on the form

## S3UploadDragger

When the file upload is the main focus, drag and drop is the better option.

The S3UploadDragger can still be clicked like the S3UploadButton, but it also allows the user to drag and drop files immediately.

```yaml ldf
_ref: pages/blog/categories/forms/file-upload/upload-dragger.yaml
```

This field also takes up more space on the page, drawing in the users attention.

## S3UploadPhoto

With the functionality of this button is very similar to the standard upload button, this block fills a common requirement within file upload.

The block clearly indicates to the user that the field is specifically for images, and is preconfigured to accept image files only.

```yaml ldf
_ref: pages/blog/categories/forms/file-upload/upload-photo.yaml
```

Not only does this make user experience more intuitive, but it makes configuration much more convenient for the developer as well.

## Learn More

AWS is just one of the many connections supported by Lowdefy by default.
Connections are also available for various SQL and NoSQL databases, as well as payment, caching, and email solutions.

For more information on [Connections and Requests,](https://docs.lowdefy.com/connections-and-requests) please refer to our documentation.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```
