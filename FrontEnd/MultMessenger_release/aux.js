/// <reference path="q.d.ts" />
var aux;
(function (aux) {
    function initializeTemplates() {
        function checkContentAvailable() {
            return 'content' in document.createElement('template');
        }
        function loadEventListener() {
            window.removeEventListener('load', loadEventListener);

            if (!checkContentAvailable()) {
                var templateElementCollection = document.getElementsByTagName('template');

                for (var i = 0; i < templateElementCollection.length; i++) {
                    var templateElem = templateElementCollection[i];
                    var childNodes = templateElem.childNodes;
                    var content = document.createDocumentFragment();

                    while (childNodes[0]) {
                        content.appendChild(childNodes[0]);
                    }

                    templateElem.content = content;
                }
            }
        }
        window.addEventListener('load', loadEventListener);
    }

    function template(options) {
        options.tagName = options.tagName || 'div';
        options.className = options.className || '';
        options.id = options.id || '';

        var templateElem = document.getElementById(options.templateId);
        var elem = document.createElement(options.tagName);

        elem.className = options.className;
        elem.id = options.id;
        elem.appendChild(templateElem.content.cloneNode(true));

        return elem;
    }
    aux.template = template;

    function checkOverflowX(elem) {
        var currentOverflowX = elem.style.overflowX;

        elem.style.overflowX = 'auto';

        var scrollWidth = elem.scrollWidth;
        var clientWidth = elem.clientWidth;
        var overflowX = scrollWidth > clientWidth;

        elem.style.overflowX = currentOverflowX;

        return overflowX;
    }
    aux.checkOverflowX = checkOverflowX;

    function checkOverflowY(elem) {
        var currentOverflowY = elem.style.overflowY;

        elem.style.overflowY = 'auto';

        var scrollHeight = elem.scrollHeight;
        var clientHeight = elem.clientHeight;
        var overflowY = scrollHeight > clientHeight;

        elem.style.overflowY = currentOverflowY;

        return overflowY;
    }
    aux.checkOverflowY = checkOverflowY;

    function checkOverflow(elem) {
        return checkOverflowX(elem) || checkOverflowY(elem);
    }
    aux.checkOverflow = checkOverflow;

    function scrollToBottom(elem) {
        elem.scrollTop = elem.scrollHeight;
    }
    aux.scrollToBottom = scrollToBottom;

    function scrollToTop(elem) {
        elem.scrollTop = 0;
    }
    aux.scrollToTop = scrollToTop;

    function getImageSizeAsync(imageUrl) {
        var deferred = Q.defer();
        var imageElem = document.createElement('img');

        imageElem.onload = function () {
            deferred.resolve({
                width: imageElem.width,
                height: imageElem.height
            });
        };
        imageElem.onerror = function () {
            deferred.reject('image load error');
        };
        imageElem.src = imageUrl;

        return deferred.promise;
    }
    aux.getImageSizeAsync = getImageSizeAsync;

    function parseStyleSize(value) {
        value = value || 0;
        if (typeof value === 'string') {
            value = parseInt(value.replace('px', ''), 10);
        }
        return value;
    }
    aux.parseStyleSize = parseStyleSize;

    function getScales(transform) {
        var result = {
            scaleX: 1,
            scaleY: 1
        };
        var regExp = /scale\((-?\d*\.?\d+)(?:,\s*(-?\d*\.?\d+))?\)/;
        var matches = transform.match(regExp) || [];
        result.scaleX = matches[1] ? parseFloat(matches[1]) : result.scaleX;
        result.scaleY = matches[2] ? parseFloat(matches[2]) : result.scaleX;
        return result;
    }
    aux.getScales = getScales;

    function getRotate(transform) {
        var result = {
            angle: 0,
            unit: 'deg'
        };
        var regExp = /rotate\((-?\d*\.?\d+)(\S+)\)/;
        var matches = transform.match(regExp) || [];
        result.angle = matches[1] ? parseFloat(matches[1]) : result.angle;
        result.unit = matches[2] ? matches[2] : result.unit;
        return result;
    }
    aux.getRotate = getRotate;

    function getTransform(elem) {
        return elem.style['-webkit-transform'] || elem.style['-moz-transform'] || elem.style['-ms-transform'] || elem.style['transform'] || '';
    }
    aux.getTransform = getTransform;

    function setTransform(elem, transform) {
        elem.style['-webkit-transform'] = elem.style['-moz-transform'] = elem.style['-ms-transform'] = elem.style['transform'] = transform;
    }
    aux.setTransform = setTransform;

    function toTransform(rotate, scales) {
        var textChunks = [];
        textChunks.push('rotate(');
        textChunks.push(rotate.angle);
        textChunks.push(rotate.unit);
        textChunks.push(') scale(');
        if (scales.scaleX === scales.scaleY) {
            textChunks.push(scales.scaleX);
        } else {
            textChunks.push(scales.scaleX);
            textChunks.push(', ');
            textChunks.push(scales.scaleY);
        }
        textChunks.push(')');
        return textChunks.join('');
    }
    aux.toTransform = toTransform;

    function requestAsync(options) {
        var url = options.url;
        var method = options.method || 'GET';
        var data = options.data;
        var headers = options.headers || [];

        var request = new XMLHttpRequest();
        var deferred = Q.defer();

        request.open(method, url, true);
        headers.forEach(function (header) {
            request.setRequestHeader(header.key, header.value);
        });
        request.onload = function () {
            deferred.resolve(request.responseText);
        };
        request.abort = function () {
            deferred.reject('request aborted');
        };
        request.onerror = function () {
            deferred.reject(request.status);
        };
        request.send(data);

        return deferred.promise;
    }
    aux.requestAsync = requestAsync;
    function requestSync(options) {
        var url = options.url;
        var method = options.method || 'GET';
        var data = options.data;
        var headers = options.headers || [];

        var request = new XMLHttpRequest();

        request.open(method, url, false);
        headers.forEach(function (header) {
            request.setRequestHeader(header.key, header.value);
        });
        request.send(data);
        return request.responseText;
    }
    aux.requestSync = requestSync;

    function uuid() {
        var date = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
            var rnd = (date + Math.random() * 16) % 16 | 0;
            date = Math.floor(date / 16);
            return (char === 'x' ? rnd : (rnd & 0x7 | 0x8)).toString(16);
        });
    }
    aux.uuid = uuid;

    initializeTemplates();
})(aux || (aux = {}));
//# sourceMappingURL=aux.js.map
