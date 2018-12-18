import { newE2EPage } from '@stencil/core/testing';

describe('app-photo', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<app-photo></app-photo>');

    const element = await page.find('app-photo');
    expect(element).toHaveClass('hydrated');
  });

  it('displays the specified name', async () => {
    const page = await newE2EPage({ url: '/photos/joseph' });

    const element = await page.find('app-photo ion-content p');
    expect(element.textContent).toContain('My name is Joseph.');
  });
});
