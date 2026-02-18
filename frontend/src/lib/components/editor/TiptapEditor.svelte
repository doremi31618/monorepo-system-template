<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor, Mark, mergeAttributes } from '@tiptap/core';
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
        onchange = () => {} 
    } = $props();

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

    onMount(() => {
        // 確保在編輯器初始化前 DOM 元素已存在
        const editorInstance = new Editor({
            element: element,
            extensions: [
                StarterKit.configure({
                    heading: { levels: [1, 2, 3] },
                    codeBlock: false, 
                    blockquote: true,
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
                Table.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
                BubbleMenuInfo.configure({
                    element: bubbleMenuElement,
                    tippyOptions: { duration: 150 },
                    shouldShow: ({ editor: activeEditor, state }) => {
                        return !state.selection.empty || activeEditor.isActive('table');
                    }
                }),
                FloatingMenuInfo.configure({
                    element: floatingMenuElement,
                    tippyOptions: { 
                        duration: 150, 
                        placement: 'bottom-start',
                        offset: [0, 8]
                    },
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
                }
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

    const convertTo = (type: string) => {
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
        else if (type === 'image') {
            const url = window.prompt('請輸入圖片網址');
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
</script>

<!-- 將選單元素移出 {#if isMounted} 並放入隱藏容器，確保初始化時存在 -->
<div class="hidden">
    <!-- Bubble Menu -->
    <div bind:this={bubbleMenuElement} class="flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-lg p-1 z-50">
        {#if editor}
            <button 
                class="{btnClass} {(editorStateToken, editor.isActive('bold')) ? 'bg-indigo-50 text-indigo-600 font-bold' : ''}" 
                onclick={() => editor?.chain().focus().toggleBold().run()}
            >
                <Bold size={16} />
            </button>
            <button 
                class="{btnClass} {(editorStateToken, editor.isActive('italic')) ? 'bg-indigo-50 text-indigo-600 font-bold' : ''}" 
                onclick={() => editor?.chain().focus().toggleItalic().run()}
            >
                <Italic size={16} />
            </button>
            <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
            <div class="flex items-center gap-1">
                {#each textColorOptions as color (color)}
                    <button
                        class="color-swatch-btn {(editorStateToken, editor.isActive('textColor', { color })) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}"
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
                        class="color-swatch-btn {(editorStateToken, editor.isActive('textBackground', { backgroundColor })) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}"
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

            {#if (editorStateToken, editor.isActive('table'))}
                <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
                <button class="{btnClass} {(editorStateToken, editor.isActive('table', { headerRow: true })) ? 'bg-indigo-50 text-indigo-600' : ''}" title="標題列" onclick={() => editor?.chain().focus().toggleHeaderRow().run()}>
                    <PanelTop size={16} />
                </button>
                <button class="{btnClass} {(editorStateToken, editor.isActive('table', { headerColumn: true })) ? 'bg-indigo-50 text-indigo-600' : ''}" title="標題欄" onclick={() => editor?.chain().focus().toggleHeaderColumn().run()}>
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

        <div bind:this={element} class="tiptap-editor prose prose-slate max-w-none focus:outline-none" />
    </div>
</div>

{#if editor && editable && isMobileView && (editorStateToken, isSlashTriggerActive())}
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
