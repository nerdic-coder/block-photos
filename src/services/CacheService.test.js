import CacheService from './CacheService';
import * as localForage from "localforage";

jest.mock('localforage');

describe('CacheService Test Suites', () => {

  it('initialize without crashing', () => {
    new CacheService();
  });

  it('get photos list', async () => {
    const mockResponse = [{
      "id": 'test123.jpg',
      "uploadedDate": "2018-07-11T21:58:39.754Z"
    }];

    localForage.getItem.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));

    const cacheService = new CacheService();
    const response = await cacheService.getItem('cachedPhotosList');

    const jsonResponse = JSON.parse(response);
    expect(Array.isArray(jsonResponse)).toBe(true);
    expect(jsonResponse).toEqual(mockResponse);

  });

  it('get empty photos list', async () => {
    const mockResponse = [];

    localForage.getItem.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));

    const cacheService = new CacheService();
    const response = await cacheService.getItem('cachedPhotosList');

    const jsonResponse = JSON.parse(response);
    expect(Array.isArray(jsonResponse)).toBe(true);
    expect(jsonResponse).toEqual(mockResponse);

  });

  it('get null photos list', async () => {

    const mockResponse = null;
    
    localForage.getItem.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));

    const cacheService = new CacheService();
    const response = await cacheService.getItem('cachedPhotosList');

    const jsonResponse = JSON.parse(response);
    expect(Array.isArray(jsonResponse)).toBe(false);
    expect(jsonResponse).toBe(null);

  });

  it('cache photo', async () => {
    const cacheService = new CacheService();
    await cacheService.setItem('test1.png', [{
      filename: 'test1.png',
      data: 'trash'
    }]);

    // const response = await cacheService.getItem('test1.png');
  
  });

});
