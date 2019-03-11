// ----------------
// Configuration
// ----------------
require('dotenv').config();

//Get the parameters from .env config file
//First the real token
var DBDeleteToken = process.env.DROPBOX_TOKEN;
// The name of the folder (all lowercase) which contains the recordings
var folderToClean = process.env.DROPBOX_FOLDER_TO_CLEAN;
// After how many hours a recording can be deleted
var deleteAfterHours = process.env.DELETE_AFTER_HOURS;

// ----------------

var fs = require("fs");
var fetch = require('isomorphic-fetch'); 
var Dropbox = require('dropbox').Dropbox;
var dbx = new Dropbox({ accessToken: DBDeleteToken , fetch: fetch });

function log(message) {
    var args = process.argv.slice(2);
    switch (args[0]){
        case '-nolog': 
            break;
        case '-debug':
            console.log(message);
            break;
        default: 
            fs.appendFileSync("DBDelete.log", message+"\n", function (err) {
                if (err) throw err;
            });        
            break;
    }
}


function listFiles(pathToCrawl){
    var filesInFolder = [];    
    dbx.filesListFolder({path: pathToCrawl})
        .then(function(response) {
            response.entries.forEach(function (entry) {
                if (entry[".tag"]==="file") {
                    var fileDate = new Date(entry.server_modified);
                    filesInFolder.push({
                        path:entry.path_lower,
                        serverModified:entry.server_modified,
                        ageInHours:Math.round(Math.abs(now -fileDate)/3600000)
                    });
                    
                }
            });
            var filesToDelete = filesInFolder.filter(function(orig){
                return orig.ageInHours>deleteAfterHours;
            });
            if (filesToDelete.length>0) {
                log(
                    "Folder "+ pathToCrawl + 
                    " has "+filesToDelete.length +" files older than " + 
                    deleteAfterHours +" hours"
                );
                filesToDelete.forEach(function (file) {
                    log(
                        "Deleting file: " +file.path + 
                        " created at "+file.serverModified
                    );
                    dbx.filesDeleteV2({path:file.path})
                    .then(function(response) {
                        return;
                    })
                    .catch(function(error) {
                        log("Function: filesDeleteV2");
                        log(error);
                      });
                });
            } else {
                log("Folder: "+pathToCrawl+" has no files to delete.");
            }
            
        })
        .catch(function(error) {
            log("Function: listFiles");
            log(error);
          });
};

var now = new Date();
if (fs.existsSync("DBDelete.log")) {log("");}
log("DropBox cleanup started:"+now);
log("Deleting files older than "+deleteAfterHours+" hours");

dbx.filesListFolder({path: folderToClean})
  .then(function(response) {
    response.entries.forEach(function (entry) {
        if (entry[".tag"]==="folder") {
            log("Inspecting folder:"+ folderToClean+ "/"+entry.name);
        }
        listFiles(folderToClean+ "/"+entry.name);
    });
  })
  .catch(function(error) {
    log("Function: main");
    log(error);
  });

