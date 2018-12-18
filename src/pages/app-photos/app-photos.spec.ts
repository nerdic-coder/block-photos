import { AppPhotos } from './app-photos';

describe('app-photos', () => {
  it('builds', () => {
    expect(new AppPhotos()).toBeTruthy();
  });

  describe('normalization', () => {
    it('returns a blank string if the name is undefined', () => {
      const component = new AppPhotos();
      expect(component.formattedName()).toEqual('');
    });

    it('capitalizes the first letter', () => {
      const component = new AppPhotos();
      component.name = 'quincy';
      expect(component.formattedName()).toEqual('Quincy');
    });

    it('lower-cases the following letters', () => {
      const component = new AppPhotos();
      component.name = 'JOSEPH';
      expect(component.formattedName()).toEqual('Joseph');
    });

    it('handles single letter names', () => {
      const component = new AppPhotos();
      component.name = 'q';
      expect(component.formattedName()).toEqual('Q');
    });
  });
});
