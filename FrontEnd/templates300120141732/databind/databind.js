window.onload = function() {

    //Internal API
    var emptyCollection = [];
    var emptyObject = {};

    var isNullOrUndefined = function(o) {
        var isNull = (o === null);
        var isUndefined = (typeof(o) === typeof(undefined));
        return isNull || isUndefined;
    };
    var bindElem = function(elem, data) {
        do {
            var dataSet = elem.dataset;
            if (isNullOrUndefined(dataSet))
                break;
            var breakValue = dataSet["break"];
            if (!isNullOrUndefined(breakValue) && breakValue === "true")
                return;
            var valueName = dataSet["value"];
            if (isNullOrUndefined(valueName))
                break;
            elem.innerText = data[valueName];
        } while(false);

        var childrenElemCollection = elem.children || emptyCollection;
        for(var i = 0; i < childrenElemCollection.length; i++) {
            var childElem = childrenElemCollection[i];
            bindElem(childElem, data);
        }
    };

    //Public API
    var createTemplate = function(templateClassName) {
        var templatesElem = document.getElementById("templates");
        var templateElem = templatesElem.querySelector("." + templateClassName);
        return templateElem.cloneNode(true);
    };
    var bindTemplate = function(template, data) {
        bindElem(template, data)
    };

    //Tests
    var page = document.getElementById("page");
    for (var i = 0; i < 2000; i++) {
        var contact = createTemplate("contact");
        bindTemplate(contact, { firstName: "John", lastName: "Snow" });
        page.appendChild(contact);
    }
};