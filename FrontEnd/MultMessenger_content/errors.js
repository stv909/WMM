var errors = errors || {};

(function(errors) {
	
	var ErrorCodes = {
		NO_CONNECTION: 1,
		API_ERROR: 2,
		TIMEOUT: 4,
		RESTRICTED: 8,
	};
	
	errors.ErrorCodes = ErrorCodes;
	
})(errors);