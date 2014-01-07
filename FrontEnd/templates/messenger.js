window.onload = function() {

    var pageElem = document.getElementById("page");
    var dialogElem = document.getElementById("dialog");
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
            containerElem.style["outline"] = "2px solid #fffc63";
        } else {
            containerElem.style["outline"] = "2px solid #fff";
        }
    };
    var isEditingMessageElem = function(messageElem) {
        var containerElems = messageElem.getElementsByClassName("container dynamic");
        return containerElems.length !== 0;
    };
    var currentMessageElem = null;
    var messageElemHandler = function(e) {
        e.stopPropagation();
    };
    var documentElemHandler = function() {
        if (currentMessageElem) {
            checkMessageElemOverflow(currentMessageElem);
            endEditingMessageElem(currentMessageElem);
            enableMessageComposer();
            currentMessageElem = null;
        }
    };
    var beginEditingMessageElem = function(messageElem) {
        if (currentMessageElem !== null && currentMessageElem !== messageElem) {
            checkMessageElemOverflow(currentMessageElem);
            endEditingMessageElem(currentMessageElem);
        }

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
        containerElem.style["overflow"] = "scroll";
        containerElem.style["outline"] = "2px solid #ddd";
        editorElem.setAttribute("contenteditable", "true");

        currentMessageElem = messageElem;
        messageElem.addEventListener("click", messageElemHandler);
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
        containerElem.scrollTop = 0;
        containerElem.scrollLeft = 0;
        editorElem.setAttribute("contenteditable", "false");

        messageElem.removeEventListener("click", messageElemHandler);
        currentMessageElem = null;
    };
    var scrollToBottom = function(elem) {
        elem.scrollTop = elem.scrollHeight;
    };
    var disableMessageComposer = function() {
        var messageElem = composerElem.getElementsByClassName("message")[0];
        var container = messageElem.getElementsByClassName("container")[0];
        var editorElem = messageElem.getElementsByClassName("editor")[0];
        composerElem.className = "composer static";
        messageElem.className = "message static";
        container.className = "container static";
        editorElem.setAttribute("contenteditable", "false");
    };
    var enableMessageComposer = function() {
        var messageElem = composerElem.getElementsByClassName("message")[0];
        var container = messageElem.getElementsByClassName("container")[0];
        var editorElem = messageElem.getElementsByClassName("editor")[0];
        composerElem.className = "composer dynamic";
        messageElem.className = "message dynamic";
        container.className = "container dynamic";
        editorElem.setAttribute("contenteditable", "true");
    };
    var showDialogElem = function(content) {
        pageElem.className = "passive";
        dialogElem.className = "active";

        var contentElem = dialogElem.getElementsByClassName("content")[0];
        contentElem.innerHTML = content;
    };
    var hideDialogElem = function() {
        pageElem.className = "active";
        dialogElem.className = "passive";

        var contentElem = dialogElem.getElementsByClassName("content")[0];
        contentElem.innerHTML = "";
        contentElem.scrollLeft = 0;
        contentElem.scrollTop = 0;
    };

    var imbueStreamMessageElem = function(messageElem) {
        var deleteElem = messageElem.getElementsByClassName("delete")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];
        var editElem = messageElem.getElementsByClassName("edit")[0];
        var fullscreenElem = messageElem.getElementsByClassName("fullscreen")[0];
        var shareElem = messageElem.getElementsByClassName("share")[0];

        var editElemHandler = function(e) {
            if (isEditingMessageElem(messageElem)) {
                checkMessageElemOverflow(messageElem);
                endEditingMessageElem(messageElem);
                enableMessageComposer();
            } else {
                beginEditingMessageElem(messageElem);
                disableMessageComposer();
            }
        };
        var clearElemHandler = function() {
            clearMessageElem(messageElem);
        };
        var fullscreenElemHandler = function() {
            var messageContent = getMessageElemContent(messageElem);
            showDialogElem(messageContent);
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
        document.addEventListener("click", documentElemHandler);
    };
    var initializeComposerMessageElem = function() {
        var messageElem = composerElem.getElementsByClassName("message")[0];
        imbueComposerMessageElem(messageElem);
    };
    var initializeDialogElem = function() {
        var closeElem = dialogElem.getElementsByClassName("close")[0];
        closeElem.addEventListener("click", hideDialogElem);
    };

    initializeStreamMessageElems();
    initializeComposerMessageElem();
    initializeDialogElem();

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