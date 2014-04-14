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

		export interface WallUploadServerResponse {
			upload_url: string;
		}

		export interface SaveWallPhotoParams {
			image: string;
			v?: number;
		}

		export interface SaveWallPhotoItem {
			owner_id: number;
			id: string;
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

		export function callMethod(method: string): void {
			VK.callMethod(method);
		}

		export function getWallUploadServerAsync(): Q.Promise<string> {
			return apiAsync('photo.getWallUploadServer', {
				v: 5.12
			}).then((response: WallUploadServerResponse) => {
				return response.upload_url;
			});
		}

		export function saveWallPhotoAsync(params: SaveWallPhotoParams): Q.Promise<SaveWallPhotoItem[]> {
			params.v = params.v || 5.12;
			return apiAsync('photos.saveWallPhoto', params);
		}

		export function getUploadedFileId(response: SaveWallPhotoItem[]): string {
			return ['photo', response[0].owner_id, '_', response[0].id].join('');
		}

	}
}