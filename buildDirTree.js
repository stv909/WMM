var fs = require('fs');
var path = require('path');
var q = require('q');
var jade = require('jade');
var stylus = require('stylus');

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

var traceDirTree = function(dirTree, callback) {
	var traceDirTreeRec = function(baseDir, dirNode) {
		var keys = Object.keys(dirNode);
		keys.forEach(function(key) {
			var dirPath = path.join(baseDir, key);
			var subDirTree = dirNode[key];
			callback(dirPath);
			traceDirTreeRec(dirPath, subDirTree);
		});
	};
	traceDirTreeRec('', dirTree);
};

var dir = process.argv[2] || '.';
var excludedDirs = ['node_modules', '.git', 'styles', 'contacts-prototype'];

buildDirTree(dir, excludedDirs).then(function(dirTree) {
	var fsWatchers = [];
	var createFsWatcher = function(baseDir) {
		var fsWatcher = fs.watch(baseDir, { persistent: true });
		fsWatcher.on('change', function(event, filename) {
			var extName = path.extname(filename);
			if (extName === ".jade") {
				var filePath = path.join(baseDir, filename);
				jade.renderFile(filePath, {
					pretty: true
				}, function(error, html) {
					if (error) {
						console.log("Can't render a jade file");
						console.log(error);
					}
					else {
						var renderedFilePath = path.join(baseDir, path.basename(filename, ".jade")) + ".html";
						fs.writeFile(renderedFilePath, html, null, function(err) {
							if (error) {
								console.log("Can't save a rendered jade file at " + renderedFilePath);
								console.log(err);
							}
							else {
								console.log("Html file saved " + renderedFilePath);
							}
						});
					}
				});
			} else if (extName === '.styl') {
				var filePath = path.join(baseDir, filename);
				fs.readFile(filePath, { encoding: 'utf-8' }, function(err, str) {
					stylus.render(str, function(error, css) {
						if (error) {
							console.log("Can't render a stylus file");
							console.log(error);
						}
						else {
							var renderedFilePath = path.join(baseDir, path.basename(filename, ".styl")) + ".css";
							fs.writeFile(renderedFilePath, css, null, function(err) {
								if (error) {
									console.log("Can't save a rendered stylus file at " + renderedFilePath);
									console.log(err);
								} else {
									console.log("Css file saved " + renderedFilePath);
								}
							});
						}
					});
				});
			}
		});
		fsWatchers.push(fsWatcher);
	};
	traceDirTree(dirTree, createFsWatcher);
});
