# DBDelete

DBDelete is a small Node.js application which can delete files which are older than 24 hours from your Dropbox account. I have a security camera which uploads automatically the recordings to Dropbox. I created this utility to make sure my Dropbox account does not run out of space.

## Installation

1. Login to Dropbox and [create a new Dropbox API app](https://www.dropbox.com/developers/apps/create)
2. In the app Settings [generate a new access token](https://www.dropbox.com/developers/reference/oauth-guide)
3. Copy the token and create a configuration file named `.env` with the following values
```dosini
DROPBOX_TOKEN='paste your token here'
DROPBOX_FOLDER_TO_CLEAN = '/ or /path to the folder in which you keep your files to delete'
DELETE_AFTER_HOURS = 24 or a value that suits your needs
```
4. Setup a crontab to run it every few hours. I added it to my Raspberry Pi's crontab by executing
```bash
crontab -e
```
and then inserting the line and save the file. 
`0 */4 * * * cd /home/myuser/DBDelete/ && node DBDelete.js`
This runs it every 4 hours and creates the log in the same folder.

## Usage

If you setup crontab correctly it fires automatically, so just sit back and relax :)

Alternatively you can run it by executing
```bash
npm run drop24
```

## Log

Each time the app runs it writes (appends to if it already exists) logs to `DBDelete.log`. If you don't want it to be created run the app with the -nolog parameter
```bash
node DBDelete -nolog
```

## Debug

To run in debug mode which just prints messages in console rather than in a DBDelete.log file execute
```bash
npm run drop24debug
```

or
```bash
node DBDelete.js -debug
```