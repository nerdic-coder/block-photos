import { AppPhoto } from './app-photo';

describe('app-photo', () => {
  it('builds', () => {
    expect(new AppPhoto()).toBeTruthy();
  });

  describe('normalization', () => {
    it('returns a blank string if the name is undefined', () => {
      const component = new AppPhoto();
      expect(component.formattedName()).toEqual('');
    });

    it('capitalizes the first letter', () => {
      const component = new AppPhoto();
      component.name = 'quincy';
      expect(component.formattedName()).toEqual('Quincy');
    });

    it('lower-cases the following letters', () => {
      const component = new AppPhoto();
      component.name = 'JOSEPH';
      expect(component.formattedName()).toEqual('Joseph');
    });

    it('handles single letter names', () => {
      const component = new AppPhoto();
      component.name = 'q';
      expect(component.formattedName()).toEqual('Q');
    });
  });
});
