var test = '<div class="tool_layerBackground" data-version="1.0.1" style="position: relative; overflow: hidden; background-image: none; background-size: contain; width: 403px; height: 403px; background-position: 0% 0%; background-repeat: no-repeat no-repeat;"><img src="https://lh4.googleusercontent.com/IwSf7l-WYdrZB9x3KPdzrnq4m2hbXyCFq26FJ3kk0i0=w688-h531-no" class="tool_layerItem_7f241be3-60b7-4d9e-9b60-e55c4bbcd26a layerType_img" draggable="true" style="position: absolute; z-index: 1; left: -171px; top: -108px; -webkit-transform: scale(0.6983372960937494) rotate(0deg);"><img src="https://lh6.googleusercontent.com/4MsgYMDz7Wb2ps0dBJ4hV0PEKZ3EGkTwuzRYe--V8PA=s403-no" class="tool_layerItem_8c135686-5235-4310-9ab1-bc55057c659b layerType_img" draggable="true" style="position: absolute; z-index: 4; left: 0px; top: -16px; -webkit-transform: scale(1) rotate(0deg);"><img src="https://lh6.googleusercontent.com/4MsgYMDz7Wb2ps0dBJ4hV0PEKZ3EGkTwuzRYe--V8PA=s403-no" class="tool_layerItem_77c79b01-d473-4a73-a22e-1a410b5a36dc layerType_img" draggable="true" style="position: absolute; z-index: 5; left: 0px; top: 3px; -webkit-transform: scale(1) rotate(0deg);"><div class="tool_layerItem_9a5f8952-7d87-4d90-ad8c-41f70b508ffc layerType_text" draggable="true" style="font-family: Impact, Charcoal, sans-serif; font-size: 35px; color: white; background-color: transparent; text-shadow: none; text-align: center; pointer-events: auto; position: absolute; z-index: 7; left: 0px; top: 3px; width: 403px; -webkit-transform: rotate(0deg);">САМ ЖИВОТНОЕ</div><div class="tool_layerItem_149026ac-a7a7-4f7f-8f15-1d6b884fe6fe layerType_text" draggable="true" style="font-family: Impact, Charcoal, sans-serif; font-size: 45px; color: white; background-color: transparent; text-shadow: none; text-align: center; pointer-events: auto; position: absolute; z-index: 6; left: 0px; top: 332px; width: 403px; -webkit-transform: rotate(0deg);">ЛОВИ ТОРТ ЛИЦОМ</div><img src="https://lh3.googleusercontent.com/-GTSWOudmDHE/UyqncK5dnZI/AAAAAAAAG08/PdIpJJA05IU/w423-h425-no/photo.png" class="tool_layerItem_c14fc0f2-ded9-41ca-9404-c3906db05af0 layerType_customImg" draggable="true" style="position: absolute; z-index: 2; left: 98px; top: 13px; -webkit-transform: scale(0.26352009446574176) rotate(14deg);"><img src="https://www.bazelevscontent.net/8582/dcf7c1d7-dbfc-4800-912b-5bd5ad4143cb_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;pete&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;mood&gt;happy&lt;/mood&gt;&lt;action&gt;rulez&lt;/action&gt;&lt;gag&gt;cake1right&lt;/gag&gt;&lt;gag&gt;laugh&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net/8582/dcf7c1d7-dbfc-4800-912b-5bd5ad4143cb_1.gif&quot;}" class="tool_layerItem_fb350f45-0cea-4551-b603-2bd96a395968 layerType_actor" draggable="true" style="position: absolute; z-index: 3; left: -139px; top: -81px; -webkit-transform: scale(0.6302494097246091) rotate(0deg);-moz-transform: scale(0.6302494097246091) rotate(0deg);"></div>';

var wkTransformPattern = /(-webkit-transform:([^;]*);)/g;
var mozTransformPattern = /(-moz-transform:([^;]*);)/g;
var msTransformPattern = /(-ms-transform:([^;]*);)/g;
var transformPattern = /([^-]transform:([^;]*);)/g;

var wkTransformRepeatPattern = /(\s*-webkit-transform:([^;]*);\s*)+/g;

var buildWkTransform = function(transformValue) {
	return ['-webkit-transform:', transformValue, ';'].join('');
};
var buildMozTransform = function(transformValue) {
	return ['-moz-transform:', transformValue, ';'].join('');
};
var buildMsTransform = function(transformValue) {
	return ['-ms-transform:', transformValue, ';'].join('');
};
var buildTransform = function(transformValue) {
	return ['transform:', transformValue, ';'].join('');
};
var replaceTransform = function(match, transform, transformValue) {
	return [
		buildWkTransform(transformValue), 
		buildMozTransform(transformValue),
		buildMsTransform(transformValue),
		buildTransform(transformValue)
	].join(' ');
};
var replaceWkTransform = function(match, transform, transformValue) {
	return buildWkTransform(transformValue);
};

var cleanData = test
	.replace(mozTransformPattern, replaceWkTransform)
	.replace(msTransformPattern, replaceWkTransform)
	.replace(transformPattern, replaceWkTransform)
	.replace(wkTransformRepeatPattern, replaceTransform)
	.replace(mozTransformPattern, replaceWkTransform)
	.replace(msTransformPattern, replaceWkTransform)
	.replace(transformPattern, replaceWkTransform)
	.replace(wkTransformRepeatPattern, replaceTransform);
console.log(cleanData);	