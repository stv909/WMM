var fs = require('fs');
var path = require('path');
var q = require('q');

var buildDirTree = function(dir, excludedDirs) {
    excludedDirs = excludedDirs || [];
        
    var readdir = q.denodeify(fs.readdir);
    var lstat = q.denodeify(fs.lstat);

    var buildDirTreeRec = function(baseDir, currentDir, dirNode) {
        var fullDir = path.join(baseDir, currentDir);
        var statPromise = lstat(fullDir);
        
        return statPromise.then(function(stat) {
            if (stat.isDirectory()) {
                dirNode[currentDir] = {};
                return readdir(fullDir);
            } else {
                return [];
            }
        }).then(function(files) {
            var subDirTreePromises = [];
            files.forEach(function(file) {
                if (excludedDirs.indexOf(file) === -1) {
                    var subDirTreePromise = buildDirTreeRec(fullDir, file, dirNode[currentDir]); 
                    subDirTreePromises.push(subDirTreePromise);
                }
            });
            return q.all(subDirTreePromises);
        }).then(function() {
            return dirNode;
        });
    };
    
    return buildDirTreeRec("", dir, {});
};

var dir = process.argv[2] || '.';
var excludedDirs = ['node_modules', '.git'];

buildDirTree(dir, excludedDirs).then(function(dirTree) {
    console.log(JSON.stringify(dirTree, 0, 4));
});