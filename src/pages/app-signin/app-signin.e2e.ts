import { newE2EPage } from '@stencil/core/testing';

describe('app-signin', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<app-signin></app-signin>');

    const element = await page.find('app-signin');
    expect(element).toHaveClass('hydrated');
  });

  it('contains a "Profile Page" button', async () => {
    const page = await newE2EPage();
    await page.setContent('<app-signin></app-signin>');

    const element = await page.find('app-signin ion-content ion-button');
    expect(element.textContent).toEqual('Profile page');
  });
});
