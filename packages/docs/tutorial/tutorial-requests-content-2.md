#### Step 12

Because we changed the environment variables, we need to restart the dev server. Press "Ctrl + c" in the terminal, and run `npx @lowdefy/cli dev` again to restart the server.

#### Step 13

To be able to use these secrets in our live app, we also need to add them in Netlify. Go to your project on Netlify. Go to "Site settings", then "Build and deploy" in the left menu. Scroll down and select "Edit variables" in the "Environment" section.

#### Step 14

Add the same variables (`LOWDEFY_SECRET_SHEETS_CLIENT_EMAIL` and `LOWDEFY_SECRET_SHEETS_PRIVATE_KEY`) with their values and save.

#### Step 15

We need to give our service account access to our Google Sheet. Go to your Google Sheet and click the "Share" button. Share the sheet with the client email of the service account we just created, with the "Editor" role.

### Using the Google Sheets connection

#### Step 1

Note down your spreadsheetId. You can find this by looking at the url in your browser when you are looking at your sheet. It should look something like:

`https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid=0`

where the spreadsheetId is a 44 character random string.

https://docs.google.com/spreadsheets/d/19lZ8yGA1pq60yBoLPWubQsKWMJRUq0gFB1sAp2r7FfE/edit#gid=0

### Step 2

To use a Google Sheet with the Lowdefy connection, we first need to define the columns in the sheet. This will be the same fields as the data we will be saving later.

In the first row of your sheet, add the following column headers:

- meeting_name
- number_of_attendees
- meeting_room
- date
- start_time
- end_time

#### Step 3

In your `lowdefy.yaml` file, add the following:

##### `lowdefy.yaml`

```
name: lowdefy-project-template
version: CURRENT_LOWDEFY_VERSION

################ -------- Copy from here -------- ################
connections:
  - id: google_sheet
    type: GoogleSheet
    properties:
      client_email:
        _secret: SHEETS_CLIENT_EMAIL
      private_key:
        _secret: SHEETS_PRIVATE_KEY
      sheetIndex: 0
      spreadsheetId: {spreadsheetId}
      write: true
################ ------- Copy to here ----------- ################

menus:
  # ...
```

#### Step 4

In your `booking.yaml` file, add the following request:

##### `pages/booking.yaml`

```yaml
id: booking
type: PageHeaderMenu
properties:
  title: Book meeting
layout:
  contentJustify: center # Center the contents of the page
################ -------- Copy from here -------- ################
requests:
  - id: save_data
    type: GoogleSheetAppendOne
    connectionId: google_sheet
    properties:
      row:
        meeting_name:
          _state: meeting_name
        number_of_attendees:
          _state: number_of_attendees
        meeting_room:
          _state: meeting_room
        date:
          _state: date
        start_time:
          _state: start_time
        end_time:
          _state: end_time
################ ------- Copy to here ----------- ################
blocks:
  # ...
```

#### Step 5

In your `booking.yaml` file, add the following action to the submit button:

##### `pages/booking.yaml`

```yaml
id: booking
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        # ...
        # ...
        # ...
      - id: submit_button
        type: Button
        #...
        actions:
          onClick:
            - id: validate
              type: Validate
            ################ -------- Copy from here -------- ################
            - id: save_data
              type: Request
              params: save_data
            ################ ------- Copy to here ----------- ################
```
