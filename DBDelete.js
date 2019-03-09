// ----------------
// Configuration
// ----------------
// Access token generated on Dropbox's UI
var DBDeleteToken = 'token';
// The name of the folder (all lowercase) which contains the recordings
var folderToClean = '/';
var deleteAfterHours = 24;

// ----------------


var fetch = require('isomorphic-fetch'); 
var Dropbox = require('dropbox').Dropbox;
var dbx = new Dropbox({ accessToken: DBDeleteToken , fetch: fetch });



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
                console.log(
                    "Folder "+ pathToCrawl + 
                    " has "+filesToDelete.length +" files older than " + 
                    deleteAfterHours +" hours"
                );
                for (i=0; i<filesToDelete.length; i++){
                    console.log(
                        "Deleting file: " +filesToDelete[i].path + 
                        " created at "+filesToDelete[i].serverModified
                    );
                    dbx.filesDeleteV2({path:filesToDelete[i].path})
                    .then(function(response) {
                        return;
                    })
                    .catch(function(error) {
                        console.log("Function: filesDeleteV2");
                        console.log(error);
                      });
                }
            } else {
                console.log("Folder: "+pathToCrawl+" has no files to delete.");
            }
            
        })
        .catch(function(error) {
            console.log("Function: listFiles");
            console.log(error);
          });
};


var now = new Date();
console.log("DropBox cleanup started:"+now);
console.log("Deleting files older than "+deleteAfterHours+" hours");

dbx.filesListFolder({path: folderToClean})
  .then(function(response) {

    var i;
    for (i= 0; i< response.entries.length; i++) {
        if (response.entries[i][".tag"]==="folder") {
            console.log("Inspecting folder:"+ folderToClean+ "/"+response.entries[i].name);
            listFiles(folderToClean+ "/"+response.entries[i].name);
        }
    }
  })
  .catch(function(error) {
    console.log("Function: main");
    console.log(error);
  });

