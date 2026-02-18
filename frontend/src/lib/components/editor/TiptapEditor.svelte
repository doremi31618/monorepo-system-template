<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor, Mark, Node, mergeAttributes } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';
    import Placeholder from '@tiptap/extension-placeholder';
    import BubbleMenuInfo from '@tiptap/extension-bubble-menu';
    import FloatingMenuInfo from '@tiptap/extension-floating-menu';
    import { Table } from '@tiptap/extension-table';
    import TableRow from '@tiptap/extension-table-row';
    import TableCell from '@tiptap/extension-table-cell';
    import TableHeader from '@tiptap/extension-table-header';
    import CodeBlock from '@tiptap/extension-code-block';
    import { Selection } from '@tiptap/pm/state';
    
    import { 
        Bold, Italic, Type, Rows, Columns,
        Heading1, Heading2, List, ListOrdered, 
        Quote, Image as ImageIcon, Plus, GripVertical, 
        Trash2, Copy, ArrowUp, ArrowDown, Table as TableIcon,
        Code2, PanelTop, PanelLeft, Minus
    } from 'lucide-svelte';

    type LinkPreviewSize = 'small' | 'medium' | 'large';

    type LinkPreviewPayload = {
        url: string;
        title?: string | null;
        description?: string | null;
        image?: string | null;
        siteName?: string | null;
    };

    type LinkPreviewResolver = (url: string) => Promise<LinkPreviewPayload | null>;

    const isHttpUrl = (value: string) => {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const LinkPreviewNode = Node.create({
        name: 'linkPreview',
        group: 'block',
        atom: true,
        selectable: true,
        draggable: true,
        addOptions() {
            return {
                editable: true,
                resolvePreview: (async (_url: string) => null) as LinkPreviewResolver,
            };
        },
        addAttributes() {
            return {
                url: {
                    default: '',
                },
                title: {
                    default: null,
                },
                description: {
                    default: null,
                },
                image: {
                    default: null,
                },
                siteName: {
                    default: null,
                },
                size: {
                    default: 'medium',
                    parseHTML: (element) => {
                        const value = element.getAttribute('data-size');
                        if (value === 'small' || value === 'medium' || value === 'large') {
                            return value;
                        }
                        return 'medium';
                    },
                    renderHTML: (attributes) => {
                        const value = attributes.size;
                        if (value === 'small' || value === 'medium' || value === 'large') {
                            return { 'data-size': value };
                        }
                        return { 'data-size': 'medium' };
                    },
                },
            };
        },
        parseHTML() {
            return [
                {
                    tag: 'div[data-link-preview]',
                },
            ];
        },
        renderHTML({ HTMLAttributes }) {
            return [
                'div',
                mergeAttributes({ 'data-link-preview': 'true' }, HTMLAttributes),
            ];
        },
        addNodeView() {
            return ({ node, getPos, editor }) => {
                let currentNode = node;
                let loading = false;
                let errorText = '';
                let lastRequestedUrl: string | null = null;

                const dom = document.createElement('div');
                dom.className = 'editor-link-preview';
                dom.setAttribute('contenteditable', 'false');

                const card = document.createElement('article');
                card.className = 'editor-link-preview-card';

                const imageWrap = document.createElement('div');
                imageWrap.className = 'editor-link-preview-image-wrap';

                const imageElement = document.createElement('img');
                imageElement.className = 'editor-link-preview-image';
                imageElement.alt = 'Link preview image';
                imageWrap.appendChild(imageElement);

                const body = document.createElement('div');
                body.className = 'editor-link-preview-body';

                const titleElement = document.createElement('p');
                titleElement.className = 'editor-link-preview-title';

                const descriptionElement = document.createElement('p');
                descriptionElement.className = 'editor-link-preview-description';

                const urlElement = document.createElement('a');
                urlElement.className = 'editor-link-preview-url';
                urlElement.target = '_blank';
                urlElement.rel = 'noreferrer';

                const statusElement = document.createElement('p');
                statusElement.className = 'editor-link-preview-status';

                const actionRow = document.createElement('div');
                actionRow.className = 'editor-link-preview-actions';

                const sizeGroup = document.createElement('div');
                sizeGroup.className = 'editor-link-preview-size-group';

                const sizeOptions: Array<{ value: LinkPreviewSize; label: string }> = [
                    { value: 'small', label: 'S' },
                    { value: 'medium', label: 'M' },
                    { value: 'large', label: 'L' },
                ];

                const sizeButtons = sizeOptions.map((option) => {
                    const button = document.createElement('button');
                    button.className = 'editor-link-preview-size-btn';
                    button.type = 'button';
                    button.textContent = option.label;
                    button.title = `${option.value} size`;
                    button.dataset.size = option.value;
                    sizeGroup.appendChild(button);
                    return { value: option.value, button };
                });

                const editButton = document.createElement('button');
                editButton.className = 'editor-link-preview-edit-btn';
                editButton.type = 'button';
                editButton.textContent = 'Change URL';

                actionRow.appendChild(sizeGroup);
                actionRow.appendChild(editButton);
                body.appendChild(titleElement);
                body.appendChild(descriptionElement);
                body.appendChild(urlElement);
                body.appendChild(statusElement);
                body.appendChild(actionRow);
                card.appendChild(imageWrap);
                card.appendChild(body);
                dom.appendChild(card);

                const currentAttrs = () => currentNode.attrs as Record<string, unknown>;
                const normalizeSize = (value: unknown): LinkPreviewSize => {
                    if (value === 'small' || value === 'medium' || value === 'large') {
                        return value;
                    }
                    return 'medium';
                };

                const resolveNodePos = () => {
                    if (typeof getPos !== 'function') return null;
                    const next = getPos();
                    return typeof next === 'number' ? next : null;
                };

                const updateNodeAttrs = (nextAttrs: Record<string, unknown>) => {
                    const pos = resolveNodePos();
                    if (pos === null) return;

                    const latestNode = editor.state.doc.nodeAt(pos);
                    if (!latestNode) return;

                    editor.view.dispatch(
                        editor.state.tr.setNodeMarkup(pos, undefined, {
                            ...latestNode.attrs,
                            ...nextAttrs,
                        })
                    );
                };

                const refreshView = () => {
                    const attrs = currentAttrs();
                    const url = typeof attrs.url === 'string' ? attrs.url : '';
                    const title = typeof attrs.title === 'string' ? attrs.title : '';
                    const description = typeof attrs.description === 'string' ? attrs.description : '';
                    const image = typeof attrs.image === 'string' ? attrs.image : '';
                    const size = normalizeSize(attrs.size);

                    card.dataset.size = size;

                    const shouldShowImage = size !== 'small' && Boolean(image);
                    imageWrap.style.display = shouldShowImage ? 'block' : 'none';
                    if (shouldShowImage) {
                        imageElement.src = image;
                    } else {
                        imageElement.removeAttribute('src');
                    }

                    titleElement.textContent = title || (loading ? 'Loading link preview...' : 'Untitled link');
                    descriptionElement.textContent = description || '';
                    descriptionElement.style.display = description ? 'block' : 'none';

                    if (url) {
                        urlElement.href = url;
                        urlElement.textContent = url;
                        urlElement.style.display = 'inline';
                    } else {
                        urlElement.removeAttribute('href');
                        urlElement.textContent = '';
                        urlElement.style.display = 'none';
                    }

                    sizeButtons.forEach(({ value, button }) => {
                        const isCurrent = value === size;
                        button.dataset.active = isCurrent ? 'true' : 'false';
                        button.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
                        button.disabled = loading;
                    });

                    const showActions = this.options.editable;
                    actionRow.style.display = showActions ? 'flex' : 'none';
                    editButton.style.display = this.options.editable ? 'inline-flex' : 'none';
                    editButton.disabled = loading;

                    if (loading) {
                        statusElement.textContent = 'Fetching preview...';
                    } else if (errorText) {
                        statusElement.textContent = errorText;
                    } else {
                        statusElement.textContent = '';
                    }
                };

                const fetchPreview = async (rawUrl: string) => {
                    const url = rawUrl.trim();
                    if (!isHttpUrl(url)) {
                        errorText = 'Invalid URL';
                        refreshView();
                        return;
                    }

                    loading = true;
                    errorText = '';
                    refreshView();

                    try {
                        const preview = await this.options.resolvePreview(url);
                        if (!preview) {
                            errorText = 'Preview unavailable';
                            return;
                        }

                        updateNodeAttrs({
                            url: preview.url || url,
                            title: preview.title ?? null,
                            description: preview.description ?? null,
                            image: preview.image ?? null,
                            siteName: preview.siteName ?? null,
                        });
                    } catch {
                        errorText = 'Preview unavailable';
                    } finally {
                        loading = false;
                        refreshView();
                    }
                };

                const maybeFetchIfNeeded = () => {
                    const attrs = currentAttrs();
                    const url = typeof attrs.url === 'string' ? attrs.url.trim() : '';
                    const hasMeta = Boolean(attrs.title || attrs.description || attrs.image);

                    if (!url || !isHttpUrl(url) || hasMeta) {
                        return;
                    }

                    if (lastRequestedUrl === url) {
                        return;
                    }

                    lastRequestedUrl = url;
                    void fetchPreview(url);
                };

                editButton.addEventListener('click', () => {
                    const attrs = currentAttrs();
                    const currentUrl = typeof attrs.url === 'string' ? attrs.url : '';
                    const nextUrl = window.prompt('Update link URL', currentUrl)?.trim();
                    if (!nextUrl || nextUrl === currentUrl) return;

                    updateNodeAttrs({
                        url: nextUrl,
                        title: null,
                        description: null,
                        image: null,
                        siteName: null,
                    });
                    lastRequestedUrl = null;
                });

                sizeButtons.forEach(({ value, button }) => {
                    button.addEventListener('click', () => {
                        if (loading) return;
                        const attrs = currentAttrs();
                        const currentSize = normalizeSize(attrs.size);
                        if (currentSize === value) return;
                        updateNodeAttrs({ size: value });
                    });
                });

                refreshView();
                maybeFetchIfNeeded();

                return {
                    dom,
                    update: (updatedNode) => {
                        if (updatedNode.type.name !== this.name) {
                            return false;
                        }

                        currentNode = updatedNode;
                        refreshView();
                        maybeFetchIfNeeded();
                        return true;
                    },
                };
            };
        },
    });

    const TableOfContentsNode = Node.create({
        name: 'tableOfContents',
        group: 'block',
        atom: true,
        selectable: true,
        draggable: true,
        parseHTML() {
            return [
                {
                    tag: 'div[data-table-of-contents]',
                },
            ];
        },
        renderHTML({ HTMLAttributes }) {
            return [
                'div',
                mergeAttributes({ 'data-table-of-contents': 'true' }, HTMLAttributes),
            ];
        },
        addNodeView() {
            return ({ editor }) => {
                const dom = document.createElement('div');
                dom.className = 'editor-toc-block';
                dom.setAttribute('contenteditable', 'false');

                const title = document.createElement('p');
                title.className = 'editor-toc-title';
                title.textContent = 'Table of Contents';

                const description = document.createElement('p');
                description.className = 'editor-toc-description';
                description.textContent = 'Click an entry to jump to the heading.';

                const list = document.createElement('div');
                list.className = 'editor-toc-list';

                const collectHeadings = () => {
                    const headings: Array<{ text: string; level: number; index: number }> = [];
                    let headingIndex = 0;

                    editor.state.doc.descendants((node) => {
                        if (node.type.name !== 'heading') return;
                        const level = Number(node.attrs.level ?? 0);
                        if (![1, 2, 3].includes(level)) return;

                        const text = node.textContent?.trim();
                        if (!text) return;

                        headings.push({
                            text,
                            level,
                            index: headingIndex,
                        });
                        headingIndex += 1;
                    });

                    return headings;
                };

                const jumpToHeading = (index: number) => {
                    const headingElements = Array.from(
                        editor.view.dom.querySelectorAll('h1, h2, h3'),
                    ) as HTMLElement[];
                    const target = headingElements[index];
                    if (!target) return;
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                };

                const renderHeadingList = () => {
                    list.innerHTML = '';
                    const headings = collectHeadings();

                    if (headings.length === 0) {
                        const empty = document.createElement('p');
                        empty.className = 'editor-toc-empty';
                        empty.textContent = 'Add H1/H2/H3 blocks to generate the TOC.';
                        list.appendChild(empty);
                        return;
                    }

                    headings.forEach((item) => {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'editor-toc-item';
                        button.style.paddingLeft = item.level === 1 ? '0.5rem' : item.level === 2 ? '1rem' : '1.5rem';
                        button.textContent = item.text;
                        button.addEventListener('click', () => jumpToHeading(item.index));
                        list.appendChild(button);
                    });
                };

                const handleEditorTransaction = () => {
                    renderHeadingList();
                };

                dom.appendChild(title);
                dom.appendChild(description);
                dom.appendChild(list);

                renderHeadingList();
                editor.on('transaction', handleEditorTransaction);

                return {
                    dom,
                    update: () => {
                        renderHeadingList();
                        return true;
                    },
                    destroy: () => {
                        editor.off('transaction', handleEditorTransaction);
                    },
                };
            };
        },
    });

    const TextColorMark = Mark.create({
        name: 'textColor',
        inclusive: true,
        addAttributes() {
            return {
                color: {
                    default: null,
                    parseHTML: (element) => {
                        const color = (element as HTMLElement).style.color;
                        return color || null;
                    },
                    renderHTML: (attributes) => {
                        if (!attributes.color) return {};
                        return { style: `color: ${attributes.color}` };
                    },
                },
            };
        },
        parseHTML() {
            return [
                {
                    tag: 'span[style]',
                    getAttrs: (element) => {
                        const color = (element as HTMLElement).style.color;
                        return color ? { color } : false;
                    },
                },
            ];
        },
        renderHTML({ HTMLAttributes }) {
            return ['span', mergeAttributes(HTMLAttributes), 0];
        },
    });

    const TextBackgroundMark = Mark.create({
        name: 'textBackground',
        inclusive: true,
        addAttributes() {
            return {
                backgroundColor: {
                    default: null,
                    parseHTML: (element) => {
                        const backgroundColor = (element as HTMLElement).style.backgroundColor;
                        return backgroundColor || null;
                    },
                    renderHTML: (attributes) => {
                        if (!attributes.backgroundColor) return {};
                        return { style: `background-color: ${attributes.backgroundColor}` };
                    },
                },
            };
        },
        parseHTML() {
            return [
                {
                    tag: 'span[style]',
                    getAttrs: (element) => {
                        const backgroundColor = (element as HTMLElement).style.backgroundColor;
                        return backgroundColor ? { backgroundColor } : false;
                    },
                },
            ];
        },
        renderHTML({ HTMLAttributes }) {
            return ['span', mergeAttributes(HTMLAttributes), 0];
        },
    });

    // --- Svelte 5 Runes ---
    let {
        content = '',
        editable = true,
        onchange = () => {},
        onRequestImage = async () => null,
        onRequestLinkPreview = async (_url: string) => null,
    } = $props<{
        content?: unknown;
        editable?: boolean;
        onchange?: (content: unknown) => void;
        onRequestImage?: () => Promise<string | null>;
        onRequestLinkPreview?: LinkPreviewResolver;
    }>();

    let element: HTMLElement | undefined = $state();
    let editor: Editor | undefined = $state();
    let bubbleMenuElement: HTMLElement | undefined = $state();
    let floatingMenuElement: HTMLElement | undefined = $state();
    
    // UI 狀態管理
    let isMounted = $state(false); 
    let sideButtonsTop = $state(0);
    let showSideButtons = $state(false);
    let showBlockMenu = $state(false);
    let currentBlockPos = $state(0); 
    let isMobileView = $state(false);
    let mobileMediaQuery: MediaQueryList | undefined = undefined;
    let mobileViewChangeHandler: ((event: MediaQueryListEvent) => void) | undefined = undefined;

    // 用於強制觸發 Svelte 重新計算 isActive 狀態的 Token
    let editorStateToken = $state(0);
    const textColorOptions = ['#0f172a', '#334155', '#ef4444', '#f97316', '#16a34a', '#2563eb', '#7c3aed'];
    const textBackgroundOptions = ['#fef3c7', '#fee2e2', '#dcfce7', '#dbeafe', '#ede9fe', '#f3f4f6'];

    const isSlashTriggerActive = () => {
        if (!editor) return false;
        const { selection } = editor.state;
        const fromPos = selection.$from;
        const textBefore = fromPos.parent.textContent;
        return selection.empty && textBefore.endsWith('/');
    };

    const requestLinkPreview = async (url: string) => {
        const normalized = url.trim();
        if (!normalized) return null;

        try {
            return await onRequestLinkPreview(normalized);
        } catch (error) {
            console.error('onRequestLinkPreview callback failed', error);
            return null;
        }
    };

    onMount(() => {
        const insertLinkPreview = async (
            targetEditor: Editor,
            url: string,
            mode: 'insert' | 'replaceParagraph' = 'insert'
        ) => {
            const normalizedUrl = url.trim();
            if (!isHttpUrl(normalizedUrl)) return false;

            const preview = await requestLinkPreview(normalizedUrl);
            const attrs: LinkPreviewPayload = {
                url: preview?.url || normalizedUrl,
                title: preview?.title ?? null,
                description: preview?.description ?? null,
                image: preview?.image ?? null,
                siteName: preview?.siteName ?? null,
            };

            if (mode === 'replaceParagraph') {
                const { selection } = targetEditor.state;
                const parentNode = selection.$from.parent;
                if (parentNode.type.name === 'paragraph') {
                    const from = selection.$from.start() - 1;
                    const to = from + parentNode.nodeSize;
                    targetEditor
                        .chain()
                        .focus()
                        .deleteRange({ from, to })
                        .insertContentAt(from, [{ type: 'linkPreview', attrs }, { type: 'paragraph' }])
                        .run();
                    return true;
                }
            }

            targetEditor.chain().focus().insertContent({ type: 'linkPreview', attrs }).run();
            return true;
        };

        // 確保在編輯器初始化前 DOM 元素已存在
        const editorInstance = new Editor({
            element: element,
            extensions: [
                StarterKit.configure({
                    heading: { levels: [1, 2, 3] },
                    codeBlock: false,
                }),
                // 設定 CodeBlock，移除這裡的 class 改由 CSS 統一管理以避免衝突
                CodeBlock.configure({
                    HTMLAttributes: {
                        class: 'code-block',
                    },
                }),
                Placeholder.configure({
                    placeholder: ({ node }) => {
                        if (node.type.name === 'heading') return `Heading ${node.attrs.level}`;
                        return "輸入 '/' 喚起指令...";
                    },
                }),
                TextColorMark,
                TextBackgroundMark,
                Image.configure({ inline: false, allowBase64: true }),
                LinkPreviewNode.configure({
                    editable,
                    resolvePreview: requestLinkPreview,
                }),
                TableOfContentsNode,
                Table.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
                BubbleMenuInfo.configure({
                    element: bubbleMenuElement,
                    shouldShow: ({ editor: activeEditor, state }) => {
                        if (!editable || !activeEditor.isEditable) return false;
                        return !state.selection.empty || activeEditor.isActive('table');
                    }
                }),
                FloatingMenuInfo.configure({
                    element: floatingMenuElement,
                    shouldShow: ({ state }) => {
                        if (isMobileView) return false;
                        const { selection } = state;
                        const fromPos = selection.$from;
                        const textBefore = fromPos.parent.textContent;
                        // 確保輸入 / 時觸發
                        return selection.empty && textBefore.endsWith('/');
                    },
                })
            ],
            content: content,
            editable: editable,
            editorProps: {
                handleDOMEvents: {
                    drop: () => false 
                },
                handleDrop(view, event, slice, moved) {
                    if (!moved && event.dataTransfer) {
                        const dragData = event.dataTransfer.getData('application/x-tiptap-block-pos');
                        if (dragData) {
                            event.preventDefault();
                            const blockStartPos = parseInt(dragData, 10);
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                            
                            if (coordinates) {
                                const { state, dispatch } = view;
                                const node = state.doc.nodeAt(blockStartPos);
                                if (!node) return false;

                                const tr = state.tr;
                                tr.delete(blockStartPos, blockStartPos + node.nodeSize);
                                const resolvedToPos = tr.mapping.map(coordinates.pos);
                                tr.insert(resolvedToPos, node);
                                
                                tr.setSelection(Selection.near(tr.doc.resolve(resolvedToPos)));
                                tr.scrollIntoView();
                                
                                dispatch(tr);
                                view.focus();
                                return true;
                            }
                        }
                    }
                    return false;
                },
                handlePaste(view, event) {
                    if (!editable || !event.clipboardData) return false;

                    const pastedText = event.clipboardData.getData('text/plain')?.trim();
                    if (!pastedText || !isHttpUrl(pastedText)) return false;

                    event.preventDefault();
                    void insertLinkPreview(editorInstance, pastedText);
                    return true;
                },
                handleKeyDown(view, event) {
                    if (!editable || event.key !== 'Enter') return false;

                    const { selection } = view.state;
                    if (!selection.empty) return false;

                    const currentParagraph = selection.$from.parent;
                    if (currentParagraph.type.name !== 'paragraph') return false;

                    const maybeUrl = currentParagraph.textContent.trim();
                    if (!isHttpUrl(maybeUrl)) return false;

                    event.preventDefault();
                    void insertLinkPreview(editorInstance, maybeUrl, 'replaceParagraph');
                    return true;
                },
            },
            onUpdate: ({ editor: currentEditor }) => {
                onchange(currentEditor.getJSON());
            },
            onTransaction: () => {
                editorStateToken += 1;
            }
        });

        editor = editorInstance;
        mobileMediaQuery = window.matchMedia('(max-width: 767px)');
        mobileViewChangeHandler = (event: MediaQueryListEvent) => {
            isMobileView = event.matches;
        };
        isMobileView = mobileMediaQuery.matches;
        mobileMediaQuery.addEventListener('change', mobileViewChangeHandler);
        isMounted = true;
    });

    const handleMouseMove = (event: MouseEvent) => {
        if (!editor || !element || !editable) return;

        const editorRect = element.getBoundingClientRect();
        const target = event.target as HTMLElement;
        
        const isOverGutter = event.clientX >= editorRect.left - 80 && event.clientX <= editorRect.left;
        const blockElement = target.closest('.tiptap-editor > .ProseMirror > *');

        if (isOverGutter || blockElement) {
            const activeEl = blockElement || document.elementFromPoint(editorRect.left + 20, event.clientY)?.closest('.tiptap-editor > .ProseMirror > *');
            
            if (activeEl && element.contains(activeEl)) {
                const nodeRect = activeEl.getBoundingClientRect();
                
                // 動態對齊邏輯
                let offset = 2;
                if (activeEl.tagName === 'H1') offset = 10;
                else if (activeEl.tagName === 'H2') offset = 6;
                else if (activeEl.tagName === 'P') offset = 2; 

                sideButtonsTop = nodeRect.top - editorRect.top + offset; 
                showSideButtons = true;

                try {
                    const pos = editor.view.posAtDOM(activeEl, 0);
                    currentBlockPos = editor.state.doc.resolve(pos).before(1);
                } catch {
                    return;
                }
            }
        } else {
            if (!showBlockMenu) {
                showSideButtons = false;
            }
        }
    };

    const handleDragStart = (event: DragEvent) => {
        if (event.dataTransfer && editor) {
            editor.commands.setNodeSelection(currentBlockPos);
            event.dataTransfer.setData('application/x-tiptap-block-pos', currentBlockPos.toString());
            event.dataTransfer.effectAllowed = 'move';
            
            const ghost = document.createElement('div');
            ghost.style.cssText = 'width:1px;height:1px;position:fixed;top:-100px';
            document.body.appendChild(ghost);
            event.dataTransfer.setDragImage(ghost, 0, 0);
        }
        showBlockMenu = false;
    };

    const handleAddBlock = () => {
        if (!editor) return;
        const node = editor.state.doc.nodeAt(currentBlockPos);
        const endPos = currentBlockPos + (node?.nodeSize || 0);
        editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).run();
        showBlockMenu = false;
    };

    const handleDeleteBlock = () => {
        if (!editor) return;
        const node = editor.state.doc.nodeAt(currentBlockPos);
        if (node) {
            editor.view.dispatch(editor.state.tr.delete(currentBlockPos, currentBlockPos + node.nodeSize));
        }
        showBlockMenu = false;
        showSideButtons = false;
    };

    const handleDuplicateBlock = () => {
        if (!editor) return;
        const node = editor.state.doc.nodeAt(currentBlockPos);
        if (node) {
            const endPos = currentBlockPos + node.nodeSize;
            editor.view.dispatch(editor.state.tr.insert(endPos, node.copy(node.content)));
        }
        showBlockMenu = false;
    };

    const moveBlock = (direction: 'up' | 'down') => {
        if (!editor) return;
        const { state, view } = editor;
        const node = state.doc.nodeAt(currentBlockPos);
        if (!node) return;

        const nodeSize = node.nodeSize;
        const tr = state.tr;

        if (direction === 'up') {
            if (currentBlockPos <= 1) return;
            const prevResolved = state.doc.resolve(currentBlockPos - 1);
            const prevPos = prevResolved.before(1);
            tr.delete(currentBlockPos, currentBlockPos + nodeSize);
            tr.insert(prevPos, node);
        } else {
            const nextPos = currentBlockPos + nodeSize;
            if (nextPos >= state.doc.content.size) return;
            const nextResolved = state.doc.resolve(nextPos + 1);
            const nextNodeEnd = nextResolved.after(1);
            tr.delete(currentBlockPos, currentBlockPos + nodeSize);
            tr.insert(nextNodeEnd - nodeSize, node);
        }

        view.dispatch(tr);
        showBlockMenu = false;
        setTimeout(() => editor?.commands.focus(), 10);
    };

    const convertTo = async (type: string) => {
        if (!editor) return;

        const { state } = editor;
        const { selection } = state;
        const fromPos = selection.$from;
        const textBefore = fromPos.parent.textContent;

        if (textBefore.endsWith('/')) {
            editor.chain()
                .focus()
                .deleteRange({ from: selection.from - 1, to: selection.from })
                .run();
        }

        if (type === 'paragraph') editor.chain().setParagraph().run();
        else if (type === 'h1') editor.chain().toggleHeading({ level: 1 }).run();
        else if (type === 'h2') editor.chain().toggleHeading({ level: 2 }).run();
        else if (type === 'bulletList') editor.chain().toggleBulletList().run();
        else if (type === 'orderedList') editor.chain().toggleOrderedList().run();
        else if (type === 'blockquote') editor.chain().toggleBlockquote().run();
        else if (type === 'codeBlock') editor.chain().toggleCodeBlock().run();
        else if (type === 'table') editor.chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        else if (type === 'tableOfContents') editor.chain().focus().insertContent({ type: 'tableOfContents' }).run();
        else if (type === 'linkPreview') {
            const url = window.prompt('請輸入連結網址');
            if (url && isHttpUrl(url)) {
                const preview = await requestLinkPreview(url);
                editor
                    .chain()
                    .focus()
                    .insertContent({
                        type: 'linkPreview',
                        attrs: {
                            url: preview?.url || url,
                            title: preview?.title ?? null,
                            description: preview?.description ?? null,
                            image: preview?.image ?? null,
                            siteName: preview?.siteName ?? null,
                        },
                    })
                    .run();
            }
        }
        else if (type === 'image') {
            let url: string | null = null;
            try {
                url = await onRequestImage();
            } catch (error) {
                console.error('onRequestImage callback failed', error);
            }
            if (!url) {
                url = window.prompt('請輸入圖片網址');
            }
            if (url) editor.chain().setImage({ src: url }).run();
        }
        
        showBlockMenu = false;
    };

    onDestroy(() => {
        if (mobileMediaQuery && mobileViewChangeHandler) {
            mobileMediaQuery.removeEventListener('change', mobileViewChangeHandler);
        }
        if (editor) editor.destroy();
    });

    const btnClass = "w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-all duration-200";
    const menuBtnClass = "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors rounded-xl font-medium text-left";
    const mobileFloatingBtnClass = "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors";

    const isEditorActive = (name: string, attrs?: Record<string, unknown>) => {
        void editorStateToken;
        if (!editor) return false;
        return editor.isActive(name, attrs);
    };

    const isTableActive = () => {
        void editorStateToken;
        if (!editor) return false;
        return editor.isActive('table');
    };

    const isMobileSlashMenuVisible = () => {
        void editorStateToken;
        return isSlashTriggerActive();
    };
</script>

<!-- 將選單元素移出 {#if isMounted} 並放入隱藏容器，確保初始化時存在 -->
<div class="hidden">
    <!-- Bubble Menu -->
    <div bind:this={bubbleMenuElement} class="flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-lg p-1 z-50">
        {#if editor}
            <button 
                class="{btnClass} {isEditorActive('bold') ? 'bg-indigo-50 text-indigo-600 font-bold' : ''}" 
                onclick={() => editor?.chain().focus().toggleBold().run()}
            >
                <Bold size={16} />
            </button>
            <button 
                class="{btnClass} {isEditorActive('italic') ? 'bg-indigo-50 text-indigo-600 font-bold' : ''}" 
                onclick={() => editor?.chain().focus().toggleItalic().run()}
            >
                <Italic size={16} />
            </button>
            <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
            <div class="flex items-center gap-1">
                {#each textColorOptions as color (color)}
                    <button
                        class="color-swatch-btn {isEditorActive('textColor', { color }) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}"
                        title={`文字色 ${color}`}
                        onclick={() => editor?.chain().focus().setMark('textColor', { color }).run()}
                    >
                        <span class="color-swatch-dot" style="background-color: {color};"></span>
                    </button>
                {/each}
                <button
                    class="color-clear-btn"
                    title="清除文字色"
                    onclick={() => editor?.chain().focus().unsetMark('textColor').run()}
                >
                    A
                </button>
            </div>

            <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
            <div class="flex items-center gap-1">
                {#each textBackgroundOptions as backgroundColor (backgroundColor)}
                    <button
                        class="color-swatch-btn {isEditorActive('textBackground', { backgroundColor }) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}"
                        title="背景色"
                        onclick={() => editor?.chain().focus().setMark('textBackground', { backgroundColor }).run()}
                    >
                        <span class="color-swatch-square" style="background-color: {backgroundColor};"></span>
                    </button>
                {/each}
                <button
                    class="color-clear-btn"
                    title="清除背景色"
                    onclick={() => editor?.chain().focus().unsetMark('textBackground').run()}
                >
                    Bg
                </button>
            </div>

            {#if isTableActive()}
                <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
                <button class="{btnClass} {isEditorActive('table', { headerRow: true }) ? 'bg-indigo-50 text-indigo-600' : ''}" title="標題列" onclick={() => editor?.chain().focus().toggleHeaderRow().run()}>
                    <PanelTop size={16} />
                </button>
                <button class="{btnClass} {isEditorActive('table', { headerColumn: true }) ? 'bg-indigo-50 text-indigo-600' : ''}" title="標題欄" onclick={() => editor?.chain().focus().toggleHeaderColumn().run()}>
                    <PanelLeft size={16} />
                </button>
                <div class="w-[1px] h-4 bg-slate-100 mx-1"></div>
                <button class={btnClass} title="插入列" onclick={() => editor?.chain().focus().addRowAfter().run()}><Rows size={16} /></button>
                <button class={btnClass} title="刪除列" onclick={() => editor?.chain().focus().deleteRow().run()}><Minus size={16} class="text-red-400" /></button>
                <button class={btnClass} title="插入欄" onclick={() => editor?.chain().focus().addColumnAfter().run()}><Columns size={16} /></button>
                <button class={btnClass} title="刪除欄" onclick={() => editor?.chain().focus().deleteColumn().run()}><Minus size={16} class="text-red-400 rotate-90" /></button>
                <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
                <button class="{btnClass} text-red-500" title="刪除表格" onclick={() => editor?.chain().focus().deleteTable().run()}><Trash2 size={16} /></button>
            {/if}

            <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
            <button class="{btnClass} text-red-500 hover:bg-red-50" onclick={() => editor?.chain().focus().unsetAllMarks().run()}>
                <Trash2 size={16} />
            </button>
        {/if}
    </div>

    <!-- Floating Menu -->
    <div bind:this={floatingMenuElement} class="flex flex-col bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 z-50">
        <p class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">基礎區塊</p>
        <button class={menuBtnClass} onclick={() => convertTo('h1')}><Heading1 size={16} class="text-slate-400" /> 標題 1</button>
        <button class={menuBtnClass} onclick={() => convertTo('h2')}><Heading2 size={16} class="text-slate-400" /> 標題 2</button>
        <button class={menuBtnClass} onclick={() => convertTo('paragraph')}><Type size={16} class="text-slate-400" /> 純文字</button>
        <button class={menuBtnClass} onclick={() => convertTo('bulletList')}><List size={16} class="text-slate-400" /> 無序清單</button>
        <button class={menuBtnClass} onclick={() => convertTo('orderedList')}><ListOrdered size={16} class="text-slate-400" /> 有序清單</button>
        <div class="h-[1px] bg-slate-100 my-1 mx-2"></div>
        <p class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">進階內容</p>
        <button class={menuBtnClass} onclick={() => convertTo('table')}><TableIcon size={16} class="text-slate-400" /> 建立表格</button>
        <button class={menuBtnClass} onclick={() => convertTo('tableOfContents')}><PanelLeft size={16} class="text-slate-400" /> 目錄區塊</button>
        <button class={menuBtnClass} onclick={() => convertTo('linkPreview')}><Quote size={16} class="text-slate-400" /> 連結預覽</button>
        <button class={menuBtnClass} onclick={() => convertTo('blockquote')}><Quote size={16} class="text-slate-400" /> 插入引言</button>
        <button class={menuBtnClass} onclick={() => convertTo('codeBlock')}><Code2 size={16} class="text-slate-400" /> 程式碼區塊</button>
        <button class={menuBtnClass} onclick={() => convertTo('image')}><ImageIcon size={16} class="text-slate-400" /> 插入圖片</button>
    </div>
</div>

<div class="max-w-4xl mx-auto p-4 pb-24 md:p-12 md:pb-12 min-h-screen bg-white transition-opacity duration-500 {isMounted ? 'opacity-100' : 'opacity-0'}">
    
    <!-- 編輯器主畫布 -->
    <div class="relative group" onmousemove={handleMouseMove} onmouseleave={() => !showBlockMenu && (showSideButtons = false)}>
        
        <!-- Notion 側邊按鈕 -->
        {#if showSideButtons && editable && isMounted}
            <div 
                class="absolute -left-14 flex items-center gap-1 transition-all duration-75 ease-out z-20" 
                style="top: {sideButtonsTop}px;"
            >
                <button onclick={handleAddBlock} title="在下方新增一行" class="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                    <Plus size={18} />
                </button>
                <div class="relative">
                    <button draggable="true" ondragstart={handleDragStart} onclick={() => showBlockMenu = !showBlockMenu} class="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-grab active:cursor-grabbing transition-colors">
                        <GripVertical size={18} />
                    </button>
                    {#if showBlockMenu}
                        <div class="absolute left-10 top-0 w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-40 animate-in fade-in zoom-in duration-150 text-left">
                            <button class="{menuBtnClass} text-red-500 hover:bg-red-50 font-semibold" onclick={handleDeleteBlock}><Trash2 size={16} /> 刪除</button>
                            <button class="{menuBtnClass} font-semibold" onclick={handleDuplicateBlock}><Copy size={16} /> 重複製作</button>
                            <div class="h-[1px] bg-slate-100 my-2 mx-1"></div>
                            <button class="{menuBtnClass} font-semibold" onclick={() => moveBlock('up')}><ArrowUp size={16} /> 向上移動</button>
                            <button class="{menuBtnClass} font-semibold" onclick={() => moveBlock('down')}><ArrowDown size={16} /> 向下移動</button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <div bind:this={element} class="tiptap-editor prose prose-slate max-w-none focus:outline-none"></div>
    </div>
</div>

{#if editor && editable && isMobileView && isMobileSlashMenuVisible()}
    <div class="mobile-floating-menu fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div class="mobile-floating-menu-scroll flex items-center gap-2 overflow-x-auto">
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('h1')}>
                <Heading1 size={14} /> H1
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('h2')}>
                <Heading2 size={14} /> H2
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('paragraph')}>
                <Type size={14} /> 文字
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('bulletList')}>
                <List size={14} /> 清單
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('orderedList')}>
                <ListOrdered size={14} /> 編號
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('blockquote')}>
                <Quote size={14} /> 引言
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('codeBlock')}>
                <Code2 size={14} /> 程式碼
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('table')}>
                <TableIcon size={14} /> 表格
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('tableOfContents')}>
                <PanelLeft size={14} /> 目錄
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('linkPreview')}>
                <Quote size={14} /> 連結
            </button>
            <button class={mobileFloatingBtnClass} onclick={() => convertTo('image')}>
                <ImageIcon size={14} /> 圖片
            </button>
        </div>
    </div>
{/if}

<style>
    /* 不需要 .tiptap-menu 樣式，因為已經移入 hidden div */

    :global(.tiptap-editor .ProseMirror) {
        outline: none;
        min-height: 500px;
        padding-left: 0;
    }

    /* 確保所有 Block 具備穩定的垂直 Padding 與位置 */
    :global(.tiptap-editor .ProseMirror > *) { 
        position: relative; 
        padding: 4px 0; 
        margin-left: 0;
    }

    :global(.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before) {
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
        font-style: italic;
        color: #cbd5e1;
    }

    :global(.tiptap-editor h1) { font-size: 2.5rem; font-weight: 850; margin-top: 2rem; margin-bottom: 0.5rem; color: #0f172a; letter-spacing: -0.02em; }
    :global(.tiptap-editor h2) { font-size: 1.875rem; font-weight: 750; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #1e293b; }
    :global(.tiptap-editor p) { line-height: 1.65; margin-top: 0.25rem; margin-bottom: 0.25rem; color: #334155; }

    :global(.tiptap-editor blockquote) { border-left: 4px solid #e2e8f0; padding-left: 1.5rem; font-style: italic; color: #64748b; margin: 1.5rem 0; }
    
    /* 優化後的程式碼區塊樣式：增加 Padding 與微邊框高光 */
    :global(.tiptap-editor pre) { 
        background: #0f172a; 
        color: #f8fafc; 
        border-radius: 0.75rem; 
        padding: 1.5rem 2rem; /* 增加水平 Padding */
        font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
        margin: 1.5rem 0; 
        overflow-x: auto;
        border: 1px solid #1e293b; /* 微弱的深色邊框 */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* 增加層次感 */
    }
    
    /* 確保 code 標籤繼承樣式 */
    :global(.tiptap-editor pre code) {
        background-color: transparent;
        color: inherit;
        padding: 0;
        font-family: inherit;
        font-size: 0.875rem;
    }

    :global(.tiptap-editor table) { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1.5rem 0; overflow: hidden; }
    :global(.tiptap-editor th, .tiptap-editor td) { border: 1px solid #e2e8f0; padding: 0.75rem; vertical-align: top; position: relative; }
    :global(.tiptap-editor th) { background-color: #f8fafc; font-weight: bold; text-align: left; }

    :global(.tiptap-editor .editor-link-preview) {
        margin: 0.75rem 0;
    }

    :global(.tiptap-editor .editor-link-preview-card) {
        width: 100%;
        max-width: 52rem;
        overflow: hidden;
        border-radius: 0.9rem;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }

    :global(.tiptap-editor .editor-link-preview-image-wrap) {
        border-bottom: 1px solid #e2e8f0;
    }

    :global(.tiptap-editor .editor-link-preview-image) {
        display: block;
        width: 100%;
        max-height: 220px;
        object-fit: cover;
    }

    :global(.tiptap-editor .editor-link-preview-body) {
        padding: 0.85rem 1rem;
    }

    :global(.tiptap-editor .editor-link-preview-title) {
        margin: 0 0 0.35rem;
        color: #0f172a;
        font-size: 0.98rem;
        font-weight: 700;
    }

    :global(.tiptap-editor .editor-link-preview-description) {
        margin: 0 0 0.45rem;
        color: #475569;
        font-size: 0.86rem;
        line-height: 1.45;
    }

    :global(.tiptap-editor .editor-link-preview-url) {
        color: #2563eb;
        font-size: 0.78rem;
        text-decoration: none;
    }

    :global(.tiptap-editor .editor-link-preview-url:hover) {
        text-decoration: underline;
    }

    :global(.tiptap-editor .editor-link-preview-status) {
        min-height: 1rem;
        margin: 0.35rem 0 0;
        color: #64748b;
        font-size: 0.75rem;
    }

    :global(.tiptap-editor .editor-link-preview-actions) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-top: 0.45rem;
    }

    :global(.tiptap-editor .editor-link-preview-size-group) {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        border: 1px solid #cbd5e1;
        border-radius: 9999px;
        background: #f8fafc;
        padding: 0.12rem;
    }

    :global(.tiptap-editor .editor-link-preview-size-btn) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.35rem;
        height: 1.35rem;
        border: 0;
        border-radius: 9999px;
        background: transparent;
        color: #475569;
        font-size: 0.68rem;
        font-weight: 700;
        line-height: 1;
        padding: 0 0.32rem;
        cursor: pointer;
    }

    :global(.tiptap-editor .editor-link-preview-size-btn:hover) {
        background: #e2e8f0;
    }

    :global(.tiptap-editor .editor-link-preview-size-btn[data-active='true']) {
        background: #1e293b;
        color: #f8fafc;
    }

    :global(.tiptap-editor .editor-link-preview-size-btn:disabled) {
        opacity: 0.6;
        cursor: not-allowed;
    }

    :global(.tiptap-editor .editor-link-preview-edit-btn) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #cbd5e1;
        border-radius: 9999px;
        padding: 0.2rem 0.65rem;
        background: #f8fafc;
        color: #334155;
        font-size: 0.72rem;
        font-weight: 600;
    }

    :global(.tiptap-editor .editor-link-preview-edit-btn:hover) {
        background: #eef2ff;
        border-color: #a5b4fc;
    }

    :global(.tiptap-editor .editor-link-preview-edit-btn:disabled) {
        opacity: 0.6;
        cursor: not-allowed;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='small']) {
        max-width: 32rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='small'] .editor-link-preview-image-wrap) {
        display: none;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='small'] .editor-link-preview-body) {
        padding: 0.68rem 0.78rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='small'] .editor-link-preview-title) {
        font-size: 0.9rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='small'] .editor-link-preview-description) {
        font-size: 0.8rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='small'] .editor-link-preview-url) {
        font-size: 0.72rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='medium']) {
        max-width: 40rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='medium'] .editor-link-preview-image) {
        max-height: 140px;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='medium'] .editor-link-preview-body) {
        padding: 0.75rem 0.9rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='medium'] .editor-link-preview-title) {
        font-size: 0.93rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='medium'] .editor-link-preview-description) {
        font-size: 0.82rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='medium'] .editor-link-preview-url) {
        font-size: 0.74rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='large']) {
        max-width: 52rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='large'] .editor-link-preview-image) {
        max-height: 220px;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='large'] .editor-link-preview-body) {
        padding: 0.85rem 1rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='large'] .editor-link-preview-title) {
        font-size: 0.98rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='large'] .editor-link-preview-description) {
        font-size: 0.86rem;
    }

    :global(.tiptap-editor .editor-link-preview-card[data-size='large'] .editor-link-preview-url) {
        font-size: 0.78rem;
    }

    :global(.tiptap-editor .editor-toc-block) {
        margin: 0.75rem 0;
        border: 1px dashed #cbd5e1;
        border-radius: 0.75rem;
        background: #f8fafc;
        padding: 0.85rem 1rem;
    }

    :global(.tiptap-editor .editor-toc-title) {
        margin: 0;
        font-size: 0.92rem;
        font-weight: 700;
        color: #0f172a;
    }

    :global(.tiptap-editor .editor-toc-description) {
        margin: 0.25rem 0 0;
        font-size: 0.8rem;
        color: #64748b;
    }

    :global(.tiptap-editor .editor-toc-list) {
        margin-top: 0.6rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    :global(.tiptap-editor .editor-toc-item) {
        width: 100%;
        border: 0;
        border-radius: 0.35rem;
        background: transparent;
        padding: 0.2rem 0.5rem;
        text-align: left;
        font-size: 0.78rem;
        color: #475569;
        cursor: pointer;
    }

    :global(.tiptap-editor .editor-toc-item:hover) {
        background: #e2e8f0;
    }

    :global(.tiptap-editor .editor-toc-empty) {
        margin: 0;
        padding: 0.3rem 0.5rem;
        font-size: 0.78rem;
        color: #94a3b8;
    }

    :global(.tiptap-editor .ProseMirror-selectednode) { background: rgba(99, 102, 241, 0.04); outline: 2px solid rgba(99, 102, 241, 0.15); border-radius: 6px; }

    .mobile-floating-menu-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .mobile-floating-menu-scroll::-webkit-scrollbar {
        display: none;
    }

    .color-swatch-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 9999px;
        border: 1px solid #e2e8f0;
        background-color: #ffffff;
    }

    .color-swatch-btn:hover {
        background-color: #f8fafc;
    }

    .color-swatch-dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 9999px;
        border: 1px solid rgba(15, 23, 42, 0.2);
    }

    .color-swatch-square {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 0.2rem;
        border: 1px solid rgba(15, 23, 42, 0.2);
    }

    .color-clear-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1.5rem;
        min-width: 1.75rem;
        padding: 0 0.35rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.4rem;
        background-color: #ffffff;
        color: #64748b;
        font-size: 0.65rem;
        font-weight: 700;
    }

    .color-clear-btn:hover {
        background-color: #f8fafc;
    }
</style>
