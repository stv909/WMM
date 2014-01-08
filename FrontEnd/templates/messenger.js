window.onload = function() {

    var pasteSnippetToInputBlock = function(htmlSnippet) {
        pasteHtmlAtCaret(document.getElementById('inputBlock'), htmlSnippet);
    }

    function pasteHtmlAtCaret(messageElement, html) {
        if (messageElement.contentEditable === 'false')
            return;
        messageElement.focus();
        var sel = window.getSelection();
        if (
            sel.baseNode.id !== messageElement.id &&
                (
                    !sel.baseNode.parentElement ||
                        sel.baseNode.parentElement.id !== messageElement.id
                    )
            )
            return;
        if (sel.getRangeAt && sel.rangeCount)
        {
            var range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            var el = document.createElement('div');
            el.innerHTML = html;
            var frag = document.createDocumentFragment();
            var node, lastNode;
            while ( (node = el.firstChild) )
            {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode)
            {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }

    var contactInfoCollection = [
        {
            nick: "@taisha",
            name: "Taisha Southwood",
            image: "http://lh6.googleusercontent.com/-DC1JTtJ1xDI/AAAAAAAAAAI/AAAAAAAAF6I/SBSyjz8mcTA/s512-c/photo.jpg"
        },
        {
            nick: "@kagawa",
            name: "Charlott Kagawa",
            image: "http://audiotool.s3.amazonaws.com/users/amaury_aguirre/avatar1/1f866b56-5805-418e-8406-c35ad2827fd1.jpg"
        },
        {
            nick: "@bromley",
            name: "Dawn Bromley",
            image: "http://images.wikia.com/half-life/en/images/archive/7/7c/20120621204410!Signcombine002b.png"
        },
        {
            nick: "@dgrumbles",
            name: "Deshawn Grumbles",
            image: "http://lh4.googleusercontent.com/-GWO1SPUrt-M/AAAAAAAAAAI/AAAAAAAAAB0/2pNfvHYUYRM/s512-c/photo.jpg"
        },
        {
            nick: "@chaves",
            name: "Emmanuel Chaves",
            image: "https://lh4.googleusercontent.com/-MpAjaJtaeao/UoeppuNeqJI/AAAAAAAAAKg/pua5nqZxsgY/Dishonored-Game-HD-Wallpapers.jpg"
        },
        {
            nick: "@van",
            name: "Van Hamilton",
            image: "http://lh4.googleusercontent.com/-51hVeEEUgKY/AAAAAAAAAAI/AAAAAAAAAQ4/HaG-is0NR9A/s512-c/photo.jpg"
        },
        {
            nick: "@patp",
            name: "Pat Parsons",
            image: "http://cs410130.vk.me/v410130260/a0ae/2ArkavZk_Cg.jpg"
        },
        {
            nick: "@guerrero",
            name: "Paula Guerrero",
            image: "https://lh3.googleusercontent.com/-KkOROFdN_oY/AAAAAAAAAAI/AAAAAAAAAKA/7vJLNjlNwtA/photo.jpg"
        },
        {
            nick: "@tbrady",
            name: "Taylor Brady",
            image: "http://dontnukethesenate.com/images/Share-image-512x512.jpg"
        },
        {
            nick: "@nashm",
            name: "Mack Nash",
            image: "https://lh3.googleusercontent.com/-acRyPjeitnQ/UoZCWKpcJDI/AAAAAAAAAFE/QRbrQ7UxG7g/darth-vader-in-the-dark.jpg"
        },
        {
            nick: "emanuel",
            name: "Emanuel Henderson",
            image: "https://lh4.googleusercontent.com/-9sd0z-vrgrY/UsAG22N0rtI/AAAAAAAAABw/fJddeEiF-Z4/feat-co-op-diablo-iii-ps3-gameplay.jpg"
        },
        {
            nick: "@vmann",
            name: "Vera Mann",
            image: "https://lh6.ggpht.com/PKbl7fkmfHE43C3wSXhmpbIaCP56NDCZfEjGVxPq_Jaop4CnUlWXf_AJtW_LI4RKex0"
        },
        {
            nick: "@mendoza",
            name: "Olive Mendoza",
            image: "http://static1.wikia.nocookie.net/__cb20120606144948/bioshock/ru/images/e/ed/Hop-Up_Cola_1.jpg"
        },
        {
            nick: "@pswanson",
            name: "Perry Swanson",
            image: "https://lh5.googleusercontent.com/-h5wokt1GCyE/AAAAAAAAAAI/AAAAAAAAABE/CSRW9LsxP-8/photo.jpg"
        },
        {
            nick: "@mcastillo",
            name: "Merle Castillo",
            image: "https://lh4.googleusercontent.com/-7M-nFqrW_7s/USEcu-ynEyI/AAAAAAAAADs/-q58nGryJ6U/17292_fallout.jpg"
        }
    ];

    var pageElem = document.getElementById("page");
    var dialogElem = document.getElementById("dialog");
    var contactsElem = document.getElementById("contacts");
    var streamElem = document.getElementById("stream");
    var streamWrapElem = streamElem.getElementsByClassName("wrap")[0];
    var toolsElem = document.getElementById("tools");
    var toolsWrapElem = toolsElem.getElementsByClassName("wrap")[0];
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
    var setMessageElemContent = function(messageElem, content) {
        var editorElem = messageElem.getElementsByClassName("editor")[0];
        editorElem.innerHTML = content;
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
    var currentMessageContent = null;
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
        var cancelElem = messageElem.getElementsByClassName("cancel")[0];
        var shareElem = messageElem.getElementsByClassName("share")[0];
        var fullscreenElem = messageElem.getElementsByClassName("fullscreen")[0];
        var deleteElem = messageElem.getElementsByClassName("delete")[0];

        var containerElem = messageElem.getElementsByClassName("container")[0];
        var editorElem = messageElem.getElementsByClassName("editor")[0];

        editElem.innerText = "finish";
        clearElem.style["display"] = "block";
        cancelElem.style["display"] = "block";
        shareElem.style["display"] = "none";
        fullscreenElem.style["display"] = "none";
        deleteElem.style["display"] = "none";

        messageElem.className = "message dynamic";
        containerElem.className = "container dynamic";
        containerElem.style["overflow"] = "scroll";
        containerElem.style["outline"] = "2px solid #ddd";
        editorElem.setAttribute("contenteditable", "true");

        currentMessageElem = messageElem;
        currentMessageContent = getMessageElemContent(currentMessageElem);
        messageElem.addEventListener("click", messageElemHandler);
    };
    var endEditingMessageElem = function(messageElem) {
        var editElem = messageElem.getElementsByClassName("edit")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];
        var cancelElem = messageElem.getElementsByClassName("cancel")[0];
        var shareElem = messageElem.getElementsByClassName("share")[0];
        var fullscreenElem = messageElem.getElementsByClassName("fullscreen")[0];
        var deleteElem = messageElem.getElementsByClassName("delete")[0];

        var containerElem = messageElem.getElementsByClassName("container")[0];
        var editorElem = messageElem.getElementsByClassName("editor")[0];

        editElem.innerText = "edit";
        clearElem.style["display"] = "none";
        cancelElem.style["display"] = "none";
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
        currentMessageContent = null;
    };
    var cancelEditingMessageElem = function(messageElem) {
        setMessageElemContent(messageElem, currentMessageContent);
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

    var chats = {};
    var currentContactName = null;

    var changeChat = function(contactInfo) {
        if (currentContactName !== contactInfo.name) {
            currentContactName = contactInfo.name;
            chats[currentContactName] = chats[currentContactName] || [];
            var contents = chats[currentContactName];

            var conversationTitleElem = document
                .getElementById("conversation")
                .getElementsByClassName("wrap")[0];
            var streamMessagesElem = document
                .getElementById("stream")
                .getElementsByClassName("wrap")[0];

            streamMessagesElem.innerHTML = "";
            conversationTitleElem.innerText = contactInfo.name + " and Me";

            for (var i = 0; i < contents.length; i++) {
                var content = contents[i];
                var messageElem = createMessageElem(content);
                imbueStreamMessageElem(messageElem);
                appendMessageElem(messageElem);
            }

            scrollToBottom(streamMessagesElem);
        }
    };
    var contactElemHandler = function(contactInfo) {
        changeChat(contactInfo);
    };
    var createContactElem = function(contactInfo) {
        var templateElem = document.getElementById("template");
        var contactElem = templateElem.getElementsByClassName("contact")[0];

        var newContactElem = contactElem.cloneNode(true);
        var avatarImageElem = newContactElem.getElementsByClassName("avatar-image")[0];
        var nameTextElem = newContactElem.getElementsByClassName("name-text")[0];

        newContactElem.setAttribute("title", contactInfo.nick);
        avatarImageElem.setAttribute("src", contactInfo.image);
        nameTextElem.innerText = contactInfo.name;

        newContactElem.addEventListener("click", function() {
           contactElemHandler(contactInfo);
        });

        return newContactElem;
    };
    var appendContactElem = function(contactElem) {
        var wrapElem = contactsElem.getElementsByClassName("wrap")[0];
        var listElem = wrapElem.getElementsByClassName("list")[0];

        listElem.appendChild(contactElem);
    };

    var createToolElem = function(title, toolControlsElem) {
        var templateElem = document.getElementById("template");
        var toolElem = templateElem.getElementsByClassName("tool")[0];

        var newToolElem = toolElem.cloneNode(true);
        var titleElem = newToolElem.getElementsByClassName("title")[0];
        var controlsElem = newToolElem.getElementsByClassName("controls")[0];

        titleElem.innerText = title;
        controlsElem.appendChild(toolControlsElem);

        return newToolElem;
    };
    var appendToolElem = function(toolElem) {
        toolsWrapElem.appendChild(toolElem);
    };

    var imbueStreamMessageElem = function(messageElem) {
        var deleteElem = messageElem.getElementsByClassName("delete")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];
        var cancelElem = messageElem.getElementsByClassName("cancel")[0];
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
        var cancelElemHandler = function() {
            cancelEditingMessageElem(messageElem);
            checkMessageElemOverflow(messageElem);
            endEditingMessageElem(messageElem);
            enableMessageComposer();
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
            cancelElem.removeEventListener("click", cancelElemHandler);
            fullscreenElem.removeEventListener("click", fullscreenElemHandler);
            shareElem.removeEventListener("click", shareElemHandler);
            deleteElem.removeEventListener("click", deleteElemHandler);
            streamWrapElem.removeChild(messageElem);
        };

        editElem.addEventListener("click", editElemHandler);
        clearElem.addEventListener("click", clearElemHandler);
        cancelElem.addEventListener("click", cancelElemHandler);
        fullscreenElem.addEventListener("click", fullscreenElemHandler);
        shareElem.addEventListener("click", shareElemHandler);
        deleteElem.addEventListener("click", deleteElemHandler);

        checkMessageElemOverflow(messageElem);
    };
    var imbueComposerMessageElem = function(messageElem) {
        var sendElem = messageElem.getElementsByClassName("send")[0];
        var clearElem = messageElem.getElementsByClassName("clear")[0];
        var editorElem = messageElem.getElementsByClassName("editor")[0];

        sendElem.addEventListener("click", function() {
            var content = getMessageElemContent(messageElem);
            var newMessageElem = createMessageElem(content);

            imbueStreamMessageElem(newMessageElem);
            appendMessageElem(newMessageElem);
            scrollToBottom(streamWrapElem);
            checkMessageElemOverflow(newMessageElem);
            clearMessageElem(messageElem);

            chats[currentContactName] = chats[currentContactName] || [];
            chats[currentContactName].push(content);
        });

        var ctrlCode = 17;
        var enterCode = 13;
        var ctrlPressed = false;

        clearElem.addEventListener("click", function() {
            clearMessageElem(messageElem);
        });
        editorElem.addEventListener("keydown", function(e) {
            if (e.keyCode === ctrlCode) {
                ctrlPressed = true;
            }
            if (e.keyCode === enterCode && !ctrlPressed) {
                sendElem.click();
                editorElem.focus();
                e.stopPropagation();
            }
        });
        editorElem.addEventListener("keyup", function(e) {
            if (e.keyCode === ctrlCode) {
                ctrlPressed = false;
            }
        });
        editorElem.addEventListener("blur", function() {
            ctrlPressed = false;
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
    var initializeContactsElem = function() {
        for (var i = 0; i < contactInfoCollection.length; i++) {
            var contactInfo = contactInfoCollection[i];
            var contactElem = createContactElem(contactInfo);
            appendContactElem(contactElem);
        }
        changeChat(contactInfoCollection[0]);
    };
    var initializeToolsElem = function() {
        var emotIcons = [
            "http://kolobok.us/smiles/light_skin/aggressive.gif",
            "http://kolobok.us/smiles/light_skin/dash3.gif",
            "http://kolobok.us/smiles/light_skin/curtsey.gif",
            "http://kolobok.us/smiles/light_skin/crazy.gif"
        ];
        var emotControlsElem = document.createElement("div");
        emotControlsElem.style.textAlign = "center";
        for (var i = 0; i < emotIcons.length; i++) {
            (function(i) {
                var spanElem = document.createElement("span");
                var imgElem = document.createElement("img");

                imgElem.setAttribute("src", emotIcons[i]);
                spanElem.style.cursor = "pointer";
                spanElem.style.marginLeft = "0.725em";
                spanElem.style.marginRight = "0.25em";
                spanElem.appendChild(imgElem);
                spanElem.addEventListener("click", function(e) {
                    var html = spanElem.innerHTML;
                    var messageElem = currentMessageElem || composerElem;
                    var editorElem = messageElem.getElementsByClassName("editor")[0];
                    pasteHtmlAtCaret(editorElem, html);
                    e.stopPropagation();
                });
                emotControlsElem.appendChild(spanElem);
            })(i);
        }

        var emoticonsTool = createToolElem("Emoticons", emotControlsElem);
        appendToolElem(emoticonsTool);
    };

    initializeStreamMessageElems();
    initializeComposerMessageElem();
    initializeDialogElem();
    initializeContactsElem();
    initializeToolsElem();

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

    var addMessageElem = document.getElementById("add-message");
    addMessageElem.addEventListener("click", function() {
        var content = '<img src="http://larryfire.files.wordpress.com/2008/11/ny.png" />';
        var newMessageElem = createMessageElem(content);

        imbueStreamMessageElem(newMessageElem);
        appendMessageElem(newMessageElem);
        scrollToBottom(streamWrapElem);
        checkMessageElemOverflow(newMessageElem);

        chats[currentContactName] = chats[currentContactName] || [];
        chats[currentContactName].push(content);
    });
};