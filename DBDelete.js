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
    var now = new Date();
    var args = process.argv.slice(2);
    switch (args[0]){
        case '-nolog': 
            break;
        case '-debug':
            console.log("["+now+"] "+message);
            break;
        default: 
            fs.appendFileSync("DBDelete.log", "["+now+"] "+message+"\n", function (err) {
                if (err) throw err;
            });        
            break;
    }
}

function filesInFolderAsync(pathToCheck){
    return new Promise(function(resolve, reject) {
        dbx.filesListFolder({path: pathToCheck})
        .then(function(response) {
            resolve(response.entries.length);
        })
        .catch(function(error) {
            reject(error);
        });
    }); 
}

function checkAndDeleteFolders(folderToCheck){
    return new Promise(function(resolve, reject) {
        filesCountInFolder=filesInFolderAsync(folderToCheck);
        filesCountInFolder.then(function(result) {
            if (result>0) {
                checkAndDeleteFilesInFolder(folderToCheck);
                resolve(0);
            } else {
                log("Deleting empty folder: " +folderToCheck);
                dbx.filesDeleteV2({path:folderToCheck})
                    .catch(function(error) {
                        log("Error while deleting empty folder "+ folderToCheck);
                        log(error);
                    });
                resolve(1);
            }
        }, 
        function(error) {
            log("Error in function: checkAndDeleteFolders");
            log("Can't get number of files in folder "+folderToCheck);
            log(error);
            reject(error);
        });
    }); 
}

function checkAndDeleteFilesInFolder(pathToCrawl){
    return new Promise(function(resolve, reject) {
        dbx.filesListFolder({path: pathToCrawl})
            .then(function(response) {
                response.entries.forEach(function (entry) {
                    if (entry[".tag"]==="file") {
                        var filesDeleted = checkAndDeleteASingleFile(entry.path_lower);
                        filesDeleted.then(function(response) {
                            null;
                        })
                        .catch(function(error) {
                            log("Error in function: checkAndDeleteFilesInFolder -> checkAndDeleteASingleFile: "+entry.path_lower);
                            log(error);
                        });
                        
                    } if ((entry[".tag"]==="folder") && (pathToCrawl!=entry.path_lower)) {
                        var foldersDeleted = checkAndDeleteFolders(entry.path_lower);
                        foldersDeleted.then(function(response) {
                            null;
                        })
                        .catch(function(error) {
                            log("Error in function: checkAndDeleteFilesInFolder -> checkAndDeleteFolders: "+entry.path_lower);
                            log(error);
                        });
                    }
                });
                resolve(response.entries.length);
            })
            .catch(function(error) {
                log("Error in function: listFiles");
                log("pathToCrawl: "+pathToCrawl);
                log(error);
                reject(error);
                });
    });
};

function checkAndDeleteASingleFile(filePath){
    return new Promise(function(resolve, reject) {
        dbx.filesGetMetadata({path: filePath})
        .then(function(response) {
            var fileMetadata = [];  
            if (response[".tag"]==="file") {
                var now = new Date();
                var fileDate = new Date(response.server_modified);
                fileMetadata.push({
                    path:response.path_lower,
                    serverModified:response.server_modified,
                    ageInHours:Math.round(Math.abs(now -fileDate)/3600000)
                    }); 
                }
            var filesToDelete = fileMetadata.filter(function(orig){
                    return orig.ageInHours>deleteAfterHours;
                });
            if (filesToDelete.length>0) {
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
                        log("Error in function: checkAndDeleteASingleFile -> filesDeleteV2");
                        log("file.path: "+file.path);
                        log(error);
                        reject(error);
                    });
                });
            }
            resolve(filesToDelete.length);
        })
        .catch(function(error) {
            log("Error in function: checkAndDeleteASingleFile -> filesGetMetadata");
            log("filePath: "+filePath);
            log(error);
            reject(error);
        });
    });
};

function main(){
log("DropBox cleanup started");
log("Deleting files older than "+deleteAfterHours+" hours");
checkAndDeleteFilesInFolder(folderToClean);
}

main();