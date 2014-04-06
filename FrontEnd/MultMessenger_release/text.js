var text = text || {};

(function(text) {

	var MAX_INT = 4294967295;

	function TextSearch(objects, stringExtractor, useIdIndex) {
		this.objects = objects;
		this.idIndices = null;
		this.stringExtractor = stringExtractor || function(object) {
			return object;
		};
		if (useIdIndex) {
			this._buildIdIndices();
		}
	}
	TextSearch.prototype._buildIdIndices = function() {
		this.idIndices = {};
		this.objects.forEach(function(object, position) {
			var id = object.get('id');
			this.idIndices[id] = position;
		}, this);
	};
	TextSearch.prototype.getObjectById = function(id) {
		if (this.idIndices) {
			var position = this.idIndices[id];
			return this.objects[position];
		} else {
			throw new Error('use id search has not been set');
		}
	};
	TextSearch.prototype.search = function(query) {
		var data;
		var tokens = this._tokenizeQuery(query);
		
		if (tokens.length) {
			var regExps = this._tokensToRegExps(tokens);
			var indices = this._buildIndices(regExps);
			data = this._buildData(indices);
		} else {
			data = this.objects.slice(0);
		}

		return data;
	};
	TextSearch.prototype._tokenizeQuery = function(query) {
		var tokens = query.split(/\s+/);
		tokens = tokens.map(function(token) {
			return token.trim();
		}).filter(function(token) {
			return token.length !== 0;
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
		indices = indices.sort(function(index1, index2) {
			var length = index1.matches.length;
			var result = 0;
			for (var i = 0; i < length; i++) {
				var match1 = index1.matches[i];
				var match2 = index2.matches[i];
				if (match1.matchPosition !== match2.matchPosition) {
					if (match1.matchPosition > match2.matchPosition) {
						result = 1;
					} else {
						result = -1;
					}
					break;
				}
			}
			return result;
		});
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
	TextSearch.prototype._buildData = function(indices) {
		return indices.map(function(index) {
			return this.objects[index.position];
		}, this);
	};

	text.TextSearch = TextSearch;

})(text);