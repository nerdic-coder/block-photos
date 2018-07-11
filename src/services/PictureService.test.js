import * as blockstack from 'blockstack';
import PictureService from './PictureService';

jest.mock('blockstack');

it('initialize without crashing', () => {
  new PictureService();
});

it('get pictures list', () => {
  const mockResponse = [{
    "id": 'test123.jpg',
    "uploadedDate": "2018-07-11T21:58:39.754Z"
  }];
  blockstack.getFile.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));

  const pictureService = new PictureService();
  pictureService.getPicturesList().then((pictures) => {
    expect(Array.isArray(pictures)).toBe(true);
    expect(pictures).toEqual(mockResponse);
  });
});

it('get empty pictures list', () => {
  const mockResponse = [];
  blockstack.getFile.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));

  const pictureService = new PictureService();
  pictureService.getPicturesList().then((pictures) => {
    expect(Array.isArray(pictures)).toBe(true);
    expect(pictures).toEqual(mockResponse);
  });
});

it('upload picture', () => {
  const pictureService = new PictureService();
  pictureService.uploadPictures([{
    filename: 'test1.png',
    data: 'trash'
  }]).then((pictures) => {
    const parsedUploadedDate = new Date(Date.parse(pictures[0].uploadedDate));
    expect(parsedUploadedDate.getFullYear()).toEqual(new Date().getFullYear());
    expect(parsedUploadedDate.getMonth()).toEqual(new Date().getMonth());
    expect(parsedUploadedDate.getDate()).toEqual(new Date().getDate());
    expect(parsedUploadedDate.getHours()).toEqual(new Date().getHours());
    expect(parsedUploadedDate.getMinutes()).toEqual(new Date().getMinutes());
    expect(pictures.length).toBeGreaterThanOrEqual(1);
    expect(pictures[0].id).toContain('test1.png');
  });
});

it('load a picture', () => {
  const mockResponse = 'base64mumbojumbo';
  blockstack.getFile.mockReturnValue(Promise.resolve(mockResponse));

  const pictureService = new PictureService();
  pictureService.loadPicture('fakeid.jpg').then((picture) => {
    expect(picture).toEqual(mockResponse);
  });
});

it('delete existing picture', () => {
  const mockResponse = [
    {
      "id": 'test123.jpg',
      "uploadedDate": "2018-07-11T21:58:39.754Z"
    },
    {
      "id": 'fakeid.jpg',
      "uploadedDate": "2018-07-11T21:58:39.754Z"
    }
  ];
  blockstack.getFile.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));

  const pictureService = new PictureService();
  pictureService.deletePicture('fakeid.jpg').then((result) => {
    expect(result).toBe(true);
  });
});

it('delete nonexistent picture', () => {
  const mockResponse = [
    {
      "id": 'test123.jpg',
      "uploadedDate": "2018-07-11T21:58:39.754Z"
    },
    {
      "id": 'fakeid.jpg',
      "uploadedDate": "2018-07-11T21:58:39.754Z"
    }
  ];
  blockstack.getFile.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));

  const pictureService = new PictureService();
  pictureService.deletePicture('fakeid-gone.jpg').then((result) => {
    expect(result).toBe(false);
  });
});
