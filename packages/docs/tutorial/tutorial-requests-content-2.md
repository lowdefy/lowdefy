#### Step 12

Because we changed the environment variables, we need to restart the dev server. Press "Ctrl + c" in the terminal, and run `npx @lowdefy/cli dev` again to restart the server.

#### Step 13

To be able to use these secrets in our live app, we also need to add them in Netlify. Go to your project on Netlify. Go to "Site settings", then "Build and deploy" in the left menu. Scroll down and select "Edit variables" in the "Environment" section.

#### Step 14

Add the same variables (`LOWDEFY_SECRET_SHEETS_CLIENT_EMAIL` and `LOWDEFY_SECRET_SHEETS_PRIVATE_KEY`) with their values and save.

#### Step 15

We need to give our service account access to our Google Sheet. Go to your Google Sheet and click the "Share" button. Share the sheet with the client email of the service account we just created, with the "Editor" role.

### What happened

We created a Google Cloud Platform (GCP) project, and created a service account in that project that we can use to access Google sheets. This gave us the credentials we need for the [`GoogleSheet`](/GoogleSheet) connection.

We set up these credentials for our local dev environment using a `.env` file, and for our Netlify app using the Netlify console.

### Using the Google Sheets connection

### Step 1

To use a Google Sheet with the Lowdefy connection, we first need to define the columns in the sheet. This will be the same fields as the data we will be saving later.

In the first row of your sheet, add the following column headers:

- meeting_name
- number_of_attendees
- meeting_room
- date
- start_time
- end_time

#### Step 2

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
      spreadsheetId: __YOUR_SPREADSHEET_ID__
      write: true
################ ------- Copy to here ----------- ################

menus:
  # ...
```

#### Step 3

Note down your spreadsheetId. You can find this by looking at the url in your browser when you are looking at your sheet. It should look something like:

`https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid=0`

where the spreadsheetId is a 44 character random string. Fill in your spreadsheetId in the spreadsheet connection.

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
            - id: save_data # Make a request to Google Sheets
              type: Request
              params: save_data
            - id: reset # Reset the form once data has been submitted
              type: Reset
            ################ ------- Copy to here ----------- ################
```

#### Step 6

If you click the submit button, you should see your data submitted to your Google Sheet.

### What happened

We set up the column names we will be using in our Google Sheet. We need to do this to use the `GoogleSheet` connection.

We defined the `GoogleSheet` connection we will be using in our app, using the credentials we obtained earlier.

We also defined a `GoogleSheetAppendOne` request, to save the data to our sheet, and called that request when clicking the submit button.

### Up next

We would like to be able to see what data has been saved. In the next section we will create a page where we can see all the meetings that have been booked.
