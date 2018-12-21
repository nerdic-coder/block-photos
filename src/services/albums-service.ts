import CacheService from './cache-service';
import uuidv4 from 'uuid/v4';

declare var blockstack;

export default class AlbumsService {

  private cache: CacheService;

  constructor() {

    this.cache = new CacheService();

  }

  async getAlbums(sync?: boolean): Promise<any> {
    let cachedAlbums = [];
    const errorsList = [];
    try {
      const rawCachedAlbums = await this.cache.getItem('cachedAlbums');
      if (rawCachedAlbums) {
        cachedAlbums = JSON.parse(rawCachedAlbums);
      }
    } catch (error) {
      errorsList.push('err_cache');
    }

    if (sync || !cachedAlbums || cachedAlbums.length === 0) {
      try {
        // Get the contents of the file albums-list.json
        const rawAlbums = await blockstack.getFile('albums-list.json');
        if (rawAlbums) {
          const albums = JSON.parse(rawAlbums);
          cachedAlbums = albums;
          await this.cache.setItem('cachedAlbums', rawAlbums);
        }
      } catch (error) {
        errorsList.push('err_list');
      }
    }

    return {
      albums: cachedAlbums,
      errorsList
    };

  }

  async createAlbum(albumName: string) {

    const albumsResponse = await this.getAlbums(true);
    let albums = albumsResponse.albums;
    if ((!albums || albums == null) && albumsResponse.errorsList.length === 0) {
      albums = [];
    }

    const errorsList = [];
    const albumId = uuidv4();
    const metadata = {
      'albumId': albumId,
      'albumName': albumName,
      'createdDate': new Date(),
      'thumbnailId': null
    };
    try {
      await blockstack.putFile(albumId, '[]');
      await this.cache.setItem(albumId, '[]');

      albums.unshift(metadata);
    } catch (error) {
      errorsList.push({
        'id': albumId,
        'errorCode': 'err_failed'
      });
    }

    await this.cache.setItem('cachedAlbums', JSON.stringify(albums));
    await blockstack.putFile('albums-list.json', JSON.stringify(albums));
    return { albums, errorsList };

  }

  async updateAlbumMetaData(albumId: string, albumName: string): Promise<any> {

    // id and metadata is required
    if (!albumId || !albumName) {
      return false;
    }
    const albumsResponse = await this.getAlbums(true);
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

    await this.cache.setItem('cachedAlbums', JSON.stringify(albums));
    await blockstack.putFile('albums-list.json', JSON.stringify(albums));

    return albums;
  }

  async deleteAlbum(albumId: string): Promise<any> {
    let returnState = false;
    try {
      // Put empty file, since deleteFile is yet not supported
      await blockstack.putFile(albumId, '');
      // TODO: add back when available.
      // await deleteFile(albumId);
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    const albumResponse = await this.getAlbums(true);
    const albums = albumResponse.albums;

    let index = 0;
    for (const photo of albums) {
      if (albumId === photo.albumId) {
        albums.splice(index, 1);
        await this.cache.setItem('cachedAlbums', JSON.stringify(albums));
        await blockstack.putFile('albums-list.json', JSON.stringify(albums));
        return albums;
      }
      index++;
    }
    return false;

  }

}
