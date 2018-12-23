import * as blockstack from 'blockstack';
import PhotosService from './photos-service';
import CacheService from './cache-service';
import UploadService from './UploadService';

jest.mock('blockstack');
jest.mock('./CacheService');
jest.mock('./UploadService');

describe('PhotosService Test Suites', () => {
  const mockPhotoListResponse = [
    {
      id: 'test1.jpg',
      uploadedDate: '2018-07-11T21:58:39.754Z'
    },
    {
      id: 'test2.jpg',
      uploadedDate: '2018-07-11T21:58:39.754Z'
    },
    {
      id: 'test3.jpg',
      uploadedDate: '2018-07-11T21:58:39.754Z'
    }
  ];

  beforeEach(() => {
    CacheService.mockClear();
    CacheService.mockImplementation(() => {
      return {
        getItem: jest.fn(),
        setItem: jest.fn()
      };
    });

    UploadService.mockClear();
    UploadService.mockImplementation(() => {
      return {
        addEventListeners: jest.fn(),
        removeEventListeners: jest.fn()
      };
    });
  });

  it('initialize without crashing', () => {
    new CacheService();
    new PhotosService();
  });

  it('get photos list', async () => {
    const mockResponse = [
      {
        id: 'test123.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      }
    ];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getPhotosList();
    const photos = response.photosList;
    expect(Array.isArray(photos)).toBe(true);
    expect(photos).toEqual(mockResponse);
  });

  it('get empty photos list', async () => {
    const mockResponse = [];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getPhotosList();
    const photos = response.photosList;
    expect(Array.isArray(photos)).toBe(true);
    expect(photos).toEqual(mockResponse);
  });

  it('get photos list cache error', async () => {
    const mockResponse = [];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getPhotosList();
    const photos = response.photosList;
    expect(Array.isArray(photos)).toBe(true);
    expect(photos).toEqual(mockResponse);
    expect(response.errorsList).toEqual([]);
  });

  it('get photos list error', async () => {
    blockstack.getFile.mockReturnValue(Promise.reject('failed!'));

    const photosService = new PhotosService();
    const response = await photosService.getPhotosList();

    const photos = response.photosList;
    expect(Array.isArray(photos)).toBe(true);
    expect(response.errorsList).toEqual(['err_list']);
  });

  it('upload photo', async () => {
    const photosService = new PhotosService();
    const response = await photosService.uploadPhoto(
      {
        filename: 'test1.png'
      },
      { target: { result: 'trash' } }
    );

    const photos = response.photosList;
    const parsedUploadedDate = new Date(Date.parse(photos[0].uploadedDate));
    expect(parsedUploadedDate.getFullYear()).toEqual(new Date().getFullYear());
    expect(parsedUploadedDate.getMonth()).toEqual(new Date().getMonth());
    expect(parsedUploadedDate.getDate()).toEqual(new Date().getDate());
    expect(parsedUploadedDate.getHours()).toEqual(new Date().getHours());
    expect(parsedUploadedDate.getMinutes()).toEqual(new Date().getMinutes());
    expect(photos.length).toBeGreaterThanOrEqual(1);
    expect(photos[0].id).toContain('test1png');
  });

  it('upload photo error', async () => {
    blockstack.putFile.mockReturnValueOnce(Promise.reject('failed!'));

    const photosService = new PhotosService();
    const response = await photosService.uploadPhoto(
      {
        filename: 'test1.png',
        stats: { size: 100 }
      },
      { target: { result: 'trash' } }
    );

    expect(response.photosList).toEqual([]);
    expect(response.errorsList[0].id).toEqual('test1.png');
    expect(response.errorsList[0].errorCode).toEqual('err_failed');
  });

  it('upload photo filesize error', async () => {
    blockstack.putFile.mockReturnValueOnce(Promise.reject('failed!'));

    const photosService = new PhotosService();
    const response = await photosService.uploadPhoto(
      {
        filename: 'test2.png',
        stats: { size: 6000000 }
      },
      { target: { result: 'trash' } }
    );

    expect(response.photosList).toEqual([]);
    expect(response.errorsList[0].id).toEqual('test2.png');
    expect(response.errorsList[0].errorCode).toEqual('err_filesize');
  });

  it('load a photo', () => {
    const mockResponse = 'base64mumbojumbo';
    blockstack.getFile.mockReturnValue(Promise.resolve(mockResponse));

    const photosService = new PhotosService();
    photosService.loadPhoto('fakeid.jpg').then(photo => {
      expect(photo).toEqual('"data:image/png;base64,' + mockResponse);
    });
  });

  it('delete existing photo', () => {
    const mockResponse = [
      {
        id: 'test123.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      },
      {
        id: 'fakeid.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      }
    ];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    photosService.deletePhoto('fakeid.jpg').then(result => {
      expect(result).toBe(true);
    });
  });

  it('delete nonexistent photo', () => {
    const mockResponse = [
      {
        id: 'test123.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      },
      {
        id: 'fakeid.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      }
    ];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    photosService.deletePhoto('fakeid-gone.jpg').then(result => {
      expect(result).toBe(false);
    });
  });

  it('get next and previous image', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getNextAndPreviousPhoto('test2.jpg');

    expect(response.previousId).toEqual('test1.jpg');
    expect(response.nextId).toEqual('test3.jpg');
  });

  it('get next image with previous image as null', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getNextAndPreviousPhoto('test1.jpg');

    expect(response.previousId).toEqual(null);
    expect(response.nextId).toEqual('test2.jpg');
  });

  it('get previous image with next image as null', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getNextAndPreviousPhoto('test3.jpg');

    expect(response.previousId).toEqual('test2.jpg');
    expect(response.nextId).toEqual(null);
  });

  it('get no previous image and no next image', async () => {
    const mockResponse = [
      {
        id: 'test1.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      }
    ];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getNextAndPreviousPhoto('test1.jpg');

    expect(response.previousId).toEqual(null);
    expect(response.nextId).toEqual(null);
  });

  it('get no previous image and no next image on wrong id', async () => {
    const mockResponse = [
      {
        id: 'test1.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      }
    ];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getNextAndPreviousPhoto('test2.jpg');

    expect(response.previousId).toEqual(null);
    expect(response.nextId).toEqual(null);
  });

  it('get no previous image and no next image on empty id', async () => {
    const mockResponse = [
      {
        id: 'test1.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z'
      }
    ];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getNextAndPreviousPhoto();

    expect(response.previousId).toEqual(null);
    expect(response.nextId).toEqual(null);
  });

  it('get no previous image and no next image on empty list', async () => {
    const mockResponse = [];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getNextAndPreviousPhoto('dummy');

    expect(response.previousId).toEqual(null);
    expect(response.nextId).toEqual(null);
  });

  it('test getPhotoMetaData', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getPhotoMetaData('test2.jpg');

    expect(response.id).toEqual('test2.jpg');
    expect(response.uploadedDate).toEqual(
      mockPhotoListResponse[1].uploadedDate
    );
  });

  it('test getPhotoMetaData not found', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getPhotoMetaData('test22.jpg');

    expect(response).toEqual({});
  });

  it('test getPhotoMetaData empty input', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.getPhotoMetaData();

    expect(response).toEqual({});
  });

  it('test setPhotoMetaData', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.setPhotoMetaData('test2.jpg', {
      id: 'test-set.jpg',
      uploadedDate: '2020-10-10'
    });

    expect(response[1].id).toEqual('test-set.jpg');
    expect(response[1].uploadedDate).toEqual('2020-10-10');
  });

  it('test setPhotoMetaData no metadata input', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.setPhotoMetaData('test2.jpg');

    expect(response).toBeFalsy();
  });

  it('test setPhotoMetaData no id input', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.setPhotoMetaData(null, {
      id: 'test-set.jpg',
      uploadedDate: '2020-10-10'
    });

    expect(response).toBeFalsy();
  });

  it('test setPhotoMetaData no input', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.setPhotoMetaData();

    expect(response).toBeFalsy();
  });

  it('test setPhotoMetaData photo not found', async () => {
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockPhotoListResponse))
    );

    const photosService = new PhotosService();
    const response = await photosService.setPhotoMetaData('test2-fake.jpg', {
      id: 'test-set.jpg',
      uploadedDate: '2020-10-10'
    });

    expect(response).toBeFalsy();
  });

  it('test rotatePhoto', async () => {
    const mockResponse = [
      {
        id: 'test1.jpg',
        uploadedDate: '2018-07-11T21:58:39.754Z',
        metadata: {
          stats: {
            exifdata: {
              tags: {
                Orientation: 1
              }
            }
          }
        }
      }
    ];
    blockstack.getFile.mockReturnValue(
      Promise.resolve(JSON.stringify(mockResponse))
    );

    const photosService = new PhotosService();
    await photosService.rotatePhoto('test1.jpg');
  });
});
