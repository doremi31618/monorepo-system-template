import { renderBlocksToHtml } from './cms.utils.js';

describe('renderBlocksToHtml', () => {
  it('renders supported content blocks and escapes user content', () => {
    expect(
      renderBlocksToHtml([
        { id: '1', type: 'h1', content: 'Release <notes>' },
        { id: '2', type: 'p', content: 'Safe & documented' },
        {
          id: '3',
          type: 'image',
          content: 'https://example.com/image?x="unsafe"',
          alt: "A 'quoted' image",
        },
      ]),
    ).toBe(
      '<h1>Release &lt;notes&gt;</h1>' +
        '<p>Safe &amp; documented</p>' +
        '<img src="https://example.com/image?x=&quot;unsafe&quot;" alt="A &#039;quoted&#039; image" />',
    );
  });

  it('returns an empty string for invalid block collections', () => {
    expect(renderBlocksToHtml(null as never)).toBe('');
  });
});
