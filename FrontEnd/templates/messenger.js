window.onload = function() {

    var streamElem = document.getElementById("stream");
    var streamWrapElem = streamElem.getElementsByClassName("wrap")[0];
    var composerElem = document.getElementById("composer");

    var checkElemOverflow = function(elem) {
        elem.style.overflow = "auto";

        var scrollHeight = elem.scrollHeight;
        var scrollWidth = elem.scrollWidth;

        var clientHeight = elem.clientHeight;
        var clientWidth = elem.clientWidth;

        var isOverflowX = scrollWidth > clientWidth;
        var isOverflowY = scrollHeight > clientHeight;
        var isOverflow = isOverflowX || isOverflowY;

        elem.style.overflow = "hidden";

        return isOverflow;
    };
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
    var checkMessageElemOverflow = function(messageElem) {
        var containerElem = messageElem.getElementsByClassName("container")[0];
        var isOverflow = checkElemOverflow(containerElem);
        if (isOverflow) {
            containerElem.style["outline"] = "2px solid #fffa94";
        } else {
            containerElem.style["outline"] = "2px solid #fff";
        }
    };
    var isEditingMessageElem = function(messageElem) {
        var containerElems = messageElem.getElementsByClassName("container dynamic");
        return containerElems.length !== 0;
    };
    var beginEditingMessageElem = function(messageElem) {
        var editElem = messageElem.getElementsByClassName("edit")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];
        var shareElem = messageElem.getElementsByClassName("share")[0];
        var fullscreenElem = messageElem.getElementsByClassName("fullscreen")[0];
        var deleteElem = messageElem.getElementsByClassName("delete")[0];

        var containerElem = messageElem.getElementsByClassName("container")[0];
        var editorElem = messageElem.getElementsByClassName("editor")[0];

        editElem.innerText = "finish";
        clearElem.style["display"] = "block";
        shareElem.style["display"] = "none";
        fullscreenElem.style["display"] = "none";
        deleteElem.style["display"] = "none";

        messageElem.className = "message dynamic";
        containerElem.className = "container dynamic";
        containerElem.style["overflow"] = "auto";
        containerElem.style["outline"] = "2px solid #eee";
        editorElem.setAttribute("contenteditable", "true");
    };
    var endEditingMessageElem = function(messageElem) {
        var editElem = messageElem.getElementsByClassName("edit")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];
        var shareElem = messageElem.getElementsByClassName("share")[0];
        var fullscreenElem = messageElem.getElementsByClassName("fullscreen")[0];
        var deleteElem = messageElem.getElementsByClassName("delete")[0];

        var containerElem = messageElem.getElementsByClassName("container")[0];
        var editorElem = messageElem.getElementsByClassName("editor")[0];

        editElem.innerText = "edit";
        clearElem.style["display"] = "none";
        shareElem.style["display"] = "block";
        fullscreenElem.style["display"] = "block";
        deleteElem.style["display"] = "block";

        messageElem.className = "message static";
        containerElem.className = "container static";
        containerElem.style["overflow"] = "hidden";
        editorElem.setAttribute("contenteditable", "false");
    };
    var scrollToBottom = function(elem) {
        elem.scrollTop = elem.scrollHeight;
    };

    var imbueStreamMessageElem = function(messageElem) {
        var deleteElem = messageElem.getElementsByClassName("delete")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];
        var editElem = messageElem.getElementsByClassName("edit")[0];
        var fullscreenElem = messageElem.getElementsByClassName("fullscreen")[0];
        var shareElem = messageElem.getElementsByClassName("share")[0];

        var editElemHandler = function() {
            if (isEditingMessageElem(messageElem)) {
                endEditingMessageElem(messageElem);
                checkMessageElemOverflow(messageElem);
            } else {
                beginEditingMessageElem(messageElem);
            }
        };
        var clearElemHandler = function() {
            clearMessageElem(messageElem);
        };
        var fullscreenElemHandler = function() {
            alert("Not implemented");
        };
        var shareElemHandler = function() {
            alert("Not implemented");
        };
        var deleteElemHandler = function() {
            editElem.removeEventListener("click", editElemHandler);
            clearElem.removeEventListener("click", clearElemHandler);
            fullscreenElem.removeEventListener("click", fullscreenElemHandler);
            shareElem.removeEventListener("click", shareElemHandler);
            deleteElem.removeEventListener("click", deleteElemHandler);
            streamWrapElem.removeChild(messageElem);
        };

        editElem.addEventListener("click", editElemHandler);
        clearElem.addEventListener("click", clearElemHandler);
        fullscreenElem.addEventListener("click", fullscreenElemHandler);
        shareElem.addEventListener("click", shareElemHandler);
        deleteElem.addEventListener("click", deleteElemHandler);

        checkMessageElemOverflow(messageElem);
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
            checkMessageElemOverflow(newMessageElem);
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
        var computedStyle = window.getComputedStyle(composerElem, null);
        if (computedStyle["display"] === "table-row") {
            composerElem.style["display"] = "none";
        } else {
            composerElem.style["display"] = "table-row";
        }
    });
};