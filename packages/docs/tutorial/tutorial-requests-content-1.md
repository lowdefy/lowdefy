### Creating a Google Sheet and getting credentials

#### Step 1

Go to [Google Sheets](https://docs.google.com/spreadsheets) and create a new Google sheet.

#### Step 2

Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in with the same Google account.

#### Step 3

Click on the "Select a project" dropdown at the top left, and then choose "NEW PROJECT". Give your project a name and click "Create".

#### Step 4

Click on the "Go to APIs overview" button, and the click "ENABLE APIS AND SERVICES".

#### Step 5

Search for "Sheets" and select the Google Sheets API.

#### Step 6

Click "Enable".

#### Step 7

Click "CREATE CREDENTIALS".

#### Step 8

Choose the following:
- **Which API are you using?**: Google Sheets API
- **Where will you be calling the API from?** : Web server (e.g. node.js, Tomcat)
- **What data will you be accessing?**: Application data
- **Are you planning to use this API with App Engine or Compute Engine?**: No, I'm not using them

Then click "What credentials do I need?"

#### Step 9

Choose the following:
- Give the account a name.
- Chose "Project > Editor" as the role.
- Choose JSON as the key type.

Click continue.

#### Step 10

You will be asked to save a file. This file contains the credentials to access your sheet, so make sure to handle it securely. Download the file.

#### Step 11

Create a file called `.env` in your project directory with the following:

##### `.env`
```
LOWDEFY_SECRET_SHEETS_CLIENT_EMAIL="__YOUR_CLIENT_EMAIL__"
LOWDEFY_SECRET_SHEETS_PRIVATE_KEY="__YOUR_PRIVATE_KEY__"
```

Fill in the `client_email` and `private_key` values from your credentials JSON file (with the quotes). This will give the development server access to these secrets.