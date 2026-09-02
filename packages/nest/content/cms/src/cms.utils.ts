export interface Block {
  id: string;
  type: 'p' | 'h1' | 'h2' | 'image';
  content: string;
  alt?: string;
}

export function renderBlocksToHtml(blocks: Block[]): string {
  if (!Array.isArray(blocks)) return '';

  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h1':
          return `<h1>${escapeHtml(block.content)}</h1>`;
        case 'h2':
          return `<h2>${escapeHtml(block.content)}</h2>`;
        case 'p':
          return `<p>${escapeHtml(block.content)}</p>`;
        case 'image':
          return `<img src="${escapeHtml(block.content)}" alt="${escapeHtml(block.alt || '')}" />`;
        default:
          return '';
      }
    })
    .join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
