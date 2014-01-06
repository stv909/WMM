window.onload = function() {

    var streamElem = document.getElementById("stream");
    var streamWrapElem = streamElem.getElementsByClassName("wrap")[0];
    var composerElem = document.getElementById("composer");

    var clearMessageElem = function(messageElem) {
        var editorElem = messageElem.getElementsByClassName("editor")[0];
        editorElem.innerHTML = "";
    };
    var getMessageElemContent = function(messageElem) {
        var editor = messageElem.getElementsByClassName("editor")[0];
        return editor.innerHTML;
    };
    var createMessageElem = function(content) {
        var templateElem = document.getElementById("template");
        var messageElem = templateElem.getElementsByClassName("message")[0];
        var newMessageElem = messageElem.cloneNode(true);
        var editorElem = newMessageElem.getElementsByClassName("editor")[0];
        editorElem.innerHTML = content;
        return newMessageElem;
    };
    var appendMessageElem = function(messageElem) {
        streamWrapElem.appendChild(messageElem);
    };
    var scrollToBottom = function(elem) {
        elem.scrollTop = elem.scrollHeight;
    };

    var imbueStreamMessageElem = function(messageElem) {
        var deleteElem = messageElem.getElementsByClassName("delete")[0];
        var editElem = messageElem.getElementsByClassName("edit")[0];
        var fullscreenElem = messageElem.getElementsByClassName("fullscreen")[0];
        var shareElem = messageElem.getElementsByClassName("share")[0];

        var editElemHandler = function() {
            alert("Not implemented");
        };
        var fullscreenElemHandler = function() {
            alert("Not implemented");
        };
        var shareElemHandler = function() {
            alert("Not implemented");
        };
        var deleteElemHandler = function() {
            editElem.removeEventListener("click", editElemHandler);
            fullscreenElem.removeEventListener("click", fullscreenElemHandler);
            shareElem.removeEventListener("click", shareElemHandler);
            deleteElem.removeEventListener("click", deleteElemHandler);
            streamWrapElem.removeChild(messageElem);
        };

        editElem.addEventListener("click", editElemHandler);
        fullscreenElem.addEventListener("click", fullscreenElemHandler);
        shareElem.addEventListener("click", shareElemHandler);
        deleteElem.addEventListener("click", deleteElemHandler);
    };
    var imbueComposerMessageElem = function(messageElem) {
        var sendElem = messageElem.getElementsByClassName("send")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];

        sendElem.addEventListener("click", function() {
            var content = getMessageElemContent(messageElem);
            var newMessageElem = createMessageElem(content);

            imbueStreamMessageElem(newMessageElem);
            appendMessageElem(newMessageElem);
            scrollToBottom(streamWrapElem);
            clearMessageElem(messageElem);
        });
        clearElem.addEventListener("click", function() {
            clearMessageElem(messageElem);
        });
    };

    var initializeStreamMessageElems = function() {
        var streamMessageElems = streamWrapElem.getElementsByClassName("message");
        for (var i = 0; i < streamMessageElems.length; i++) {
            var messageElem = streamMessageElems[i];
            imbueStreamMessageElem(messageElem);
        }
    };
    var initializeComposerMessageElem = function() {
        var messageElem = composerElem.getElementsByClassName("message")[0];
        imbueComposerMessageElem(messageElem);
    };

    initializeStreamMessageElems();
    initializeComposerMessageElem();

    // AddHoc

    var hideComposerElem = document.getElementById("hide-composer");
    hideComposerElem.addEventListener("click", function() {
        var computedStyle = window.getComputedStyle(composerElem);
        if (computedStyle["display"] === "table-row") {
            composerElem.style["display"] = "none";
        } else {
            composerElem.style["display"] = "table-row";
        }
    });
};