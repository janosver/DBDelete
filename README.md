# DBDelete

DBDelete is a small application which can delete <x> hour old files from your Dropbox account. I have a security camera which uploads automatically the recordings. I created this utility to make sure my Dropbox account does not run out of space.

## Installation

1. Download `DBDelete.js` and `package-lock.json`
2. Use the package manager [npm](https://www.npmjs.com/get-npm) to install the dependencies.
```bash
npm install
```
3. Login to Dropbox and [create a new Dropbox API app](https://www.dropbox.com/developers/apps/create)
4. In the app Settings [generate a new access token](https://www.dropbox.com/developers/reference/oauth-guide)
5. Copy the token and in `DBDelete.js` replace DBDeleteToken's variable value 'token' with it
6. Setup a crontab to run it every few hours


## Usage

If you setup crontab correctly it fires automatically, so just sit back and relax :)

## Log

Each time the app runs it writes (appends to if it already exists) logs to `DBDelete.log`. If you don't want it to be created run the app with the -nolog parameter
```bash
node DBDelete -nolog
```