var text = text || {};

(function(text) {

	var MAX_INT = 4294967295;

	function TextSearch(objects, stringExtractor) {
		this.objects = objects;
		this.stringExtractor = stringExtractor || function(object) {
			return object;
		};
	}
	TextSearch.prototype.search = function(query) {
		var tokens = this._tokenizeQuery(query);
		var regExps = this._tokensToRegExps(tokens);
		var indices = this._buildIndices(regExps);
		console.log(JSON.stringify(indices, null, 4));
	};
	TextSearch.prototype._tokenizeQuery = function(query) {
		query = query.trim();
		var tokens = query.split(/\s+/);
		tokens = tokens.map(function(token) {
			return token.trim();
		});
		return tokens;
	};
	TextSearch.prototype._tokensToRegExps = function(tokens) {
		return tokens.map(function(token) {
			return new RegExp(token, 'i');
		});
	};
	TextSearch.prototype._buildIndices = function(regExps) {
		var indices = [];
		this.objects.forEach(function(object, position) {
			var strings = this.stringExtractor(object);
			var index = this._buildIndex(strings, position, regExps);
			if (index) {
				indices.push(index);
			}
		}, this);
		return indices;
	};
	TextSearch.prototype._buildIndex = function(strings, position, regExps) {
		regExps = regExps.slice(0);
		strings = strings.slice(0);

		var index = null;
		var expectedMatchCount = regExps.length;

		while (true) {
			var result = this._match(strings, regExps);
			if (result.has) {
				index = index || {};
				index.position = index.position || position;
				index.matches = index.matches || [];
				index.matches.push({
					stringIndex: result.stringIndex,
					matchPosition: result.matchPosition
				});
				regExps.splice(result.regExpIndex, 1);
				strings.splice(result.stringIndex, 1);
			} else{
				break;
			}
		}

		if (index) {
			if (index.matches.length !== expectedMatchCount) {
				index = null;
			} else {
				index.matches = index.matches.sort(function(m1, m2) {
					if (m1.matchPosition >= m2.matchPosition) {
						return 1;
					} else if (m1.matchPosition < m2.matchPosition) {
						return -1;
					} else {
						return 0;
					}
				});
			}
		}

		return index;
	};
	TextSearch.prototype._match = function(strings, regExps) {
		var result = {
			has: false,
			matchPosition: MAX_INT,
			stringIndex: null,
			regExpIndex: null
		};
		regExps.forEach(function(regExp, i) {
			strings.forEach(function(str, j) {
				var match = str.search(regExp);
				if (match !== -1) {
					result.has = true;
					if (match < result.matchPosition) {
						result.matchPosition = match;
						result.regExpIndex = i;
						result.stringIndex = j;
					}
				}
			});
		});
		return result;
	};

	text.TextSearch = TextSearch;

})(text);