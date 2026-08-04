export type TocItem = {
    id: string;
    level: number;
    text: string;
    anchor: string;
};

type TiptapNode = {
    type?: string;
    attrs?: Record<string, unknown>;
    text?: string;
    content?: TiptapNode[];
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const extractText = (node: TiptapNode): string => {
    const chunks: string[] = [];

    const walk = (current: TiptapNode | undefined) => {
        if (!current) return;
        if (typeof current.text === 'string') {
            chunks.push(current.text);
        }
        if (Array.isArray(current.content)) {
            current.content.forEach((child) => walk(child));
        }
    };

    walk(node);
    return chunks.join('').trim();
};

export const extractTocFromTiptap = (body: unknown): TocItem[] => {
    if (!body || typeof body !== 'object') return [];

    const root = body as TiptapNode;
    const results: TocItem[] = [];
    const slugCounter = new Map<string, number>();

    const walk = (node: TiptapNode | undefined) => {
        if (!node) return;

        if (node.type === 'heading') {
            const level = Number(node.attrs?.level ?? 0);
            if (level >= 1 && level <= 3) {
                const text = extractText(node);
                if (text) {
                    const base = slugify(text) || `heading-${results.length + 1}`;
                    const count = slugCounter.get(base) ?? 0;
                    slugCounter.set(base, count + 1);
                    const anchor = count === 0 ? base : `${base}-${count + 1}`;

                    results.push({
                        id: `${anchor}-${results.length + 1}`,
                        level,
                        text,
                        anchor,
                    });
                }
            }
        }

        if (Array.isArray(node.content)) {
            node.content.forEach((child) => walk(child));
        }
    };

    walk(root);
    return results;
};

export const hasTableOfContentsNode = (body: unknown): boolean => {
    if (!body || typeof body !== 'object') return false;

    const walk = (node: TiptapNode | undefined): boolean => {
        if (!node) return false;
        if (node.type === 'tableOfContents') return true;
        if (!Array.isArray(node.content)) return false;
        return node.content.some((child) => walk(child));
    };

    return walk(body as TiptapNode);
};
