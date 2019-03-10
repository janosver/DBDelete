// ----------------
// Configuration
// ----------------
require('dotenv').config();

var DBDeleteToken = process.env.DROPBOX_TOKEN;
// The name of the folder (all lowercase) which contains the recordings
var folderToClean = process.env.DROPBOX_FOLDER_TO_CLEAN;
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
            for (i=0; i<response.entries.length; i++) {
                if (response.entries[i][".tag"]==="file") {
                    var fileDate = new Date(response.entries[i].server_modified);
                    filesInFolder.push({
                        path:response.entries[i].path_lower,
                        serverModified:response.entries[i].server_modified,
                        ageInHours:Math.round(Math.abs(now -fileDate)/3600000)
                    });
                }
            } 
            var filesToDelete = filesInFolder.filter(function(orig){
            return orig.ageInHours>deleteAfterHours;
            });
            if (filesToDelete.length>0) {
                log(
                    "Folder "+ pathToCrawl + 
                    " has "+filesToDelete.length +" files older than " + 
                    deleteAfterHours +" hours"
                );
                for (i=0; i<filesToDelete.length; i++){
                    log(
                        "Deleting file: " +filesToDelete[i].path + 
                        " created at "+filesToDelete[i].serverModified
                    );
                    dbx.filesDeleteV2({path:filesToDelete[i].path})
                    .then(function(response) {
                        return;
                    })
                    .catch(function(error) {
                        log("Function: filesDeleteV2");
                        log(error);
                      });
                }
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

    var i;
    for (i= 0; i< response.entries.length; i++) {
        if (response.entries[i][".tag"]==="folder") {
            log("Inspecting folder:"+ folderToClean+ "/"+response.entries[i].name);
        }
        listFiles(folderToClean+ "/"+response.entries[i].name);
    }
  })
  .catch(function(error) {
    log("Function: main");
    log(error);
  });

