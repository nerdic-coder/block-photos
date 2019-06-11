import uuidv4 from 'uuid/v4';

import StorageService from './storage-service';

export default class AlbumsService {
  static async getAlbums(updateCache?: boolean): Promise<any> {
    let cachedAlbums = [];
    const errorsList = [];
    try {
      const rawCachedAlbums = await StorageService.getItem(
        'albums-list.json',
        updateCache,
        updateCache
      );
      if (rawCachedAlbums) {
        cachedAlbums = JSON.parse(rawCachedAlbums);
      } else {
        errorsList.push('err_list');
      }
    } catch (error) {
      errorsList.push('err_list');
    }

    return {
      albums: cachedAlbums,
      errorsList
    };
  }

  static async createAlbum(albumName: string) {
    const albumsResponse = await AlbumsService.getAlbums(true);
    let albums = albumsResponse.albums;
    if ((!albums || albums == null) && albumsResponse.errorsList.length === 0) {
      albums = [];
    }

    const errorsList = [];
    const albumId = uuidv4();
    const metadata = {
      albumId,
      albumName,
      createdDate: new Date(),
      thumbnailId: null
    };
    try {
      await StorageService.setItem(albumId, '[]');

      albums.unshift(metadata);
    } catch (error) {
      errorsList.push({
        id: albumId,
        errorCode: 'err_failed'
      });
    }

    await StorageService.setItem('albums-list.json', JSON.stringify(albums));
    return { albums, errorsList };
  }

  static async updateAlbumName(
    albumId: string,
    albumName: string
  ): Promise<any> {
    // id and metadata is required
    if (!albumId || !albumName) {
      return false;
    }
    const albumsResponse = await AlbumsService.getAlbums(true);
    const albums = albumsResponse.albums;
    let albumFound = false;
    let index = 0;
    for (const album of albums) {
      // Current album
      if (album.albumId === albumId) {
        albums[index].albumName = albumName;
        albumFound = true;
        break;
      }
      index++;
    }

    // Don't update if album don't exist
    if (!albumFound) {
      return false;
    }

    await StorageService.setItem('albums-list.json', JSON.stringify(albums));

    return albums;
  }

  static async updateAlbumThumbnail(
    albumId: string,
    thumbnailId: string
  ): Promise<any> {
    // id and metadata is required
    if (!albumId || !thumbnailId) {
      return false;
    }
    const albumsResponse = await AlbumsService.getAlbums(true);
    const albums = albumsResponse.albums;
    let albumFound = false;
    let index = 0;
    for (const album of albums) {
      // Current album
      if (album.albumId === albumId) {
        albums[index].thumbnailId = thumbnailId;
        albumFound = true;
        break;
      }
      index++;
    }

    // Don't update if album don't exist
    if (!albumFound) {
      return false;
    }

    await StorageService.setItem('albums-list.json', JSON.stringify(albums));

    return albums;
  }

  static async deleteAlbum(albumId: string): Promise<any> {
    let returnState = false;
    try {
      StorageService.deleteItem(albumId);
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    const albumResponse = await AlbumsService.getAlbums(true);
    const albums = albumResponse.albums;

    let index = 0;
    for (const photo of albums) {
      if (albumId === photo.albumId) {
        albums.splice(index, 1);
        await StorageService.setItem(
          'albums-list.json',
          JSON.stringify(albums)
        );
        return albums;
      }
      index++;
    }
    return false;
  }

  static async getAlbumMetaData(albumId: string): Promise<any> {
    let response = {};
    const albumsResponse = await AlbumsService.getAlbums();
    const albums = albumsResponse.albums;

    let index = 0;
    for (const album of albums) {
      // Current album
      if (album.albumId === albumId) {
        response = albums[index];
        break;
      }
      index++;
    }

    return response;
  }
}
