# Working with Forms in Lowdefy

## Pt. 6: Connections and Requests

Lowdefy's input blocks have excellent functionality out of the box, but a large part of what makes Lowdefy so powerful is Connections.

In a Lowdefy app you can integrate with other services like API's or databases using Connections and Requests.

Connections configure the settings to the external service, and often contain parameters like connection strings, URLs and secrets like passwords or API keys.

Requests are used to interact with the connection, such as inserting a data record, executing a query or calling an API end-point.

File management is a great example to illustrate the power of Connections in Lowdefy.

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

1. AwsS3PresignedGetObject, which is used to get a download link for an object in S3.

2. AwsS3PresignedPostPolicy, which is used to create a policy to allow file upload to S3.

## Learn More

AWS is just one of the many connections supported by Lowdefy by default.
Connections are also available for various SQL and NoSQL databases, as well as payment, caching, and email solutions.

For more information on [Connections and Requests,](https://docs.lowdefy.com/connections-and-requests) please refer to our documentation.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```
