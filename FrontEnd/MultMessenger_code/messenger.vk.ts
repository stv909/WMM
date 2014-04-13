/// <reference path="q.d.ts" />
/// <reference path="messenger.misc.ts" />

module messenger {
	export module vk {

		declare var VK: any;

		export interface User {
			id: number;
			first_name: string;
			last_name: string;
			photo_200?: string;
			photo_100?: string;
			photo_50?: string;
			can_post?: boolean;
		}

		export interface Group {
			id: number;
			name: string;
			photo_200?: string;
			photo_100?: string;
			photo_50?: string;
			type: string;
			can_post?: boolean;
		}

		export interface FriendsResponse {
			count: number;
			items: User[];
		}

		export interface GroupsResponse {
			count: number;
			items: Group[];
		}

		export function apiAsync(method: string, params?: {}): Q.Promise<any> {
			var deferred = Q.defer();

			VK.api(method, params, data => {
				if (data.hasOwnProperty('response')) {
					deferred.resolve(data.response);
				} else {
					deferred.reject({
						errorCode: misc.ErrorCodes.API_ERROR,
						message: data.error
					})
				}
			});

			return deferred.promise;
		}

		export function initAsync(): Q.Promise<any> {
			var deferred = Q.defer();

			VK.init(() => {
				deferred.resolve(true);
			}, () => {
				deferred.reject({
					errorCode: misc.ErrorCodes.API_ERROR
				});
			}, 5.12);

			return deferred.promise;
		}

	}
}