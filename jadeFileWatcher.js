var fs = require("fs");
var jade = require("jade");
var path = require("path");

var templatesPath = "FrontEnd/templates/";
fs.watch(templatesPath, { persistent: true }, function(event, filename) {
    var extName = path.extname(filename);
    if (extName === ".jade") {
        var filePath = templatesPath + filename;
        jade.renderFile(filePath, { pretty: true}, function(error, html) {
           if (error) {
               console.log("Can't render a jade file");
               console.log(error);
           } else {
               var renderedFilePath = templatesPath + path.basename(filename, ".jade") + ".html";
               fs.writeFile(renderedFilePath, html, null, function(err) {
                   if (error) {
                        console.log("Can't save a rendered jade file");
                        console.log(err);
                   } else {
                       console.log("Html file saved " + Date.now());
                   }
               })
           }
        });
    }
});