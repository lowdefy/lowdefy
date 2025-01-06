# Working with Forms in Lowdefy

## Pt. 5: Uploading Files

In addition to general text input, users may need to upload files.

Whether to provide a scan of an identity document or a signed PDF document, it is important that your forms are able to handle these requirements.

Lowdefy features blocks with Amazon S3 integration to store files uploaded by users.

These blocks provide the standard UI and UX that users are familiar with, being upload buttons, drag & drop dialog boxes, and image upload fields.

## S3UploadButton

File upload is not always the main focus of a form.
If uploading the file is optional, for example, or if you don't want to distract from more important fields, a simple button is the way to go.

The S3UploadButton opens the file system dialog when clicked, and is presented as a button with an icon and "Upload" text.

It is a very compact block, taking up little space on the form

## S3UploadDragger

When the file upload is the main focus, drag and drop is the better option.

The S3UploadDragger can still be clicked like the S3UploadButton, but it also allows the user to drag and drop files immediately.

This field also takes up more space on the page, drawing in the users attention.

## S3UploadPhoto

With the functionality of this button is very similar to the standard upload button, this block fills a common requirement within file upload.

The block clearly indicates to the user that the field is specifically for images, and is preconfigured to accept image files only.

Not only does this make user experience more intuitive, but it makes configuration much more convenient for the developer as well.

## Learn More

Lowdefy's S3 integration makes working with files easy for both developers and users.

In the next post, we'll take a break from the input blocks themselves, and provide more detail on working with Amazon S3 in Lowdefy.

Start your own Lowdefy project to try out file upload in Lowdefy.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```

Don't forget to look through our [docs](https://docs.lowdefy.com/S3UploadButton) for more details on features and implementation.
