import { newE2EPage } from '@stencil/core/testing';

describe('app-photos', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<app-photos></app-photos>');

    const element = await page.find('app-photos');
    expect(element).toHaveClass('hydrated');
  });

  it('displays the specified name', async () => {
    const page = await newE2EPage({ url: '/photos/joseph' });

    const element = await page.find('app-photos ion-content p');
    expect(element.textContent).toContain('My name is Joseph.');
  });
});
