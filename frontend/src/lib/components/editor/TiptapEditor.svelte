<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';
    import Placeholder from '@tiptap/extension-placeholder';
    import BubbleMenuInfo from '@tiptap/extension-bubble-menu';
    import FloatingMenuInfo from '@tiptap/extension-floating-menu';
    import {Table} from '@tiptap/extension-table';
    import TableRow from '@tiptap/extension-table-row';
    import TableCell from '@tiptap/extension-table-cell';
    import TableHeader from '@tiptap/extension-table-header';
    import CodeBlock from '@tiptap/extension-code-block';
    import { Selection } from '@tiptap/pm/state';
    
    import { 
        Bold, Italic, Strikethrough, Code, Type, Rows, Columns,
        Heading1, Heading2, List, ListOrdered, 
        Quote, Image as ImageIcon, Plus, GripVertical, 
        Trash2, Copy, ArrowUp, ArrowDown, Table as TableIcon,
        Code2, PanelTop, PanelLeft, Minus
    } from 'lucide-svelte';

    // --- Svelte 5 Runes ---
    let { 
        content = '', 
        editable = true,
        onchange = (data: any) => {} 
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

    // 用於強制觸發 Svelte 重新計算 isActive 狀態的 Token
    let editorStateToken = $state(0);

    onMount(() => {
        editor = new Editor({
            element: element,
            extensions: [
                StarterKit.configure({
                    heading: { levels: [1, 2, 3] },
                    codeBlock: false, 
                    blockquote: true,
                }),
                CodeBlock.configure({
                    HTMLAttributes: {
                        class: 'rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-sm my-4',
                    },
                }),
                Placeholder.configure({
                    placeholder: ({ node }) => {
                        if (node.type.name === 'heading') return `Heading ${node.attrs.level}`;
                        return "輸入 '/' 喚起指令...";
                    },
                }),
                Image.configure({ inline: false, allowBase64: true }),
                Table.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
                BubbleMenuInfo.configure({
                    element: bubbleMenuElement,
                    tippyOptions: { duration: 150 },
                    // 只要進入表格或選取文字就顯示選單
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
                        const { selection } = state;
                        const fromPos = (selection as any).$from;
                        const textBefore = fromPos.parent.textContent;
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

        isMounted = true;
    });

    const handleMouseMove = (event: MouseEvent) => {
        if (!editor || !element || !editable) return;

        const editorRect = element.getBoundingClientRect();
        const target = event.target as HTMLElement;
        
        const isOverGutter = event.clientX >= editorRect.left - 60 && event.clientX <= editorRect.left;
        const blockElement = target.closest('.tiptap-editor > .ProseMirror > *');

        if (isOverGutter || blockElement) {
            const activeEl = blockElement || document.elementFromPoint(editorRect.left + 20, event.clientY)?.closest('.tiptap-editor > .ProseMirror > *');
            
            if (activeEl && element.contains(activeEl)) {
                const nodeRect = activeEl.getBoundingClientRect();
                sideButtonsTop = nodeRect.top - editorRect.top;
                showSideButtons = true;

                try {
                    const pos = editor.view.posAtDOM(activeEl, 0);
                    currentBlockPos = editor.state.doc.resolve(pos).before(1);
                } catch (e) {}
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
        const fromPos = (selection as any).$from;
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
        if (editor) editor.destroy();
    });

    const btnClass = "w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-all duration-200";
    const menuBtnClass = "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors rounded-xl font-medium text-left";
</script>

<div class="max-w-4xl mx-auto p-4 md:p-12 min-h-screen bg-white transition-opacity duration-500 {isMounted ? 'opacity-100' : 'opacity-0'}">
    
    <!-- Bubble Menu -->
    <div bind:this={bubbleMenuElement} class="flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-lg p-1 z-50">
        {#if editor}
            <!-- 反應式更新按鈕狀態 -->
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

            <!-- 表格專屬工具列 (重新設計區分功能) -->
            {#if (editorStateToken, editor.isActive('table'))}
                <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
                
                <!-- 標題切換組 -->
                <button 
                    class="{btnClass} {(editorStateToken, editor.isActive('table', { headerRow: true })) ? 'bg-indigo-50 text-indigo-600' : ''}" 
                    title="切換標題列 (橫)" 
                    onclick={() => editor?.chain().focus().toggleHeaderRow().run()}
                >
                    <PanelTop size={16} />
                </button>
                <button 
                    class="{btnClass} {(editorStateToken, editor.isActive('table', { headerColumn: true })) ? 'bg-indigo-50 text-indigo-600' : ''}" 
                    title="切換標題欄 (直)" 
                    onclick={() => editor?.chain().focus().toggleHeaderColumn().run()}
                >
                    <PanelLeft size={16} />
                </button>

                <div class="w-[1px] h-4 bg-slate-100 mx-1"></div>

                <!-- 列/欄 增刪組 -->
                <div class="flex items-center bg-slate-50 rounded-md p-0.5 gap-0.5">
                    <button class={btnClass} title="插入列" onclick={() => editor?.chain().focus().addRowAfter().run()}>
                        <Rows size={16} />
                    </button>
                    <button class={btnClass} title="刪除列" onclick={() => editor?.chain().focus().deleteRow().run()}>
                        <Minus size={16} class="text-red-400" />
                    </button>
                </div>

                <div class="flex items-center bg-slate-50 rounded-md p-0.5 gap-0.5">
                    <button class={btnClass} title="插入欄" onclick={() => editor?.chain().focus().addColumnAfter().run()}>
                        <Columns size={16} />
                    </button>
                    <button class={btnClass} title="刪除欄" onclick={() => editor?.chain().focus().deleteColumn().run()}>
                        <Minus size={16} class="text-red-400 rotate-90" />
                    </button>
                </div>

                <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
                <button class="{btnClass} text-red-500 hover:bg-red-50" title="刪除整張表格" onclick={() => editor?.chain().focus().deleteTable().run()}>
                    <Trash2 size={16} />
                </button>
            {/if}

            <div class="w-[1px] h-4 bg-slate-200 mx-1"></div>
            <button class="{btnClass} text-red-500 hover:bg-red-50" onclick={() => editor?.chain().focus().unsetAllMarks().run()}>
                <Trash2 size={16} />
            </button>
        {/if}
    </div>

    <!-- Floating Menu: 指令窗 -->
    <div bind:this={floatingMenuElement} class="flex flex-col bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 z-50">
        <p class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">基礎區塊</p>
        <button class={menuBtnClass} onclick={() => convertTo('h1')}>
            <Heading1 size={16} class="text-slate-400" /> 標題 1
        </button>
        <button class={menuBtnClass} onclick={() => convertTo('h2')}>
            <Heading2 size={16} class="text-slate-400" /> 標題 2
        </button>
        <button class={menuBtnClass} onclick={() => convertTo('paragraph')}>
            <Type size={16} class="text-slate-400" /> 純文字
        </button>
        <button class={menuBtnClass} onclick={() => convertTo('bulletList')}>
            <List size={16} class="text-slate-400" /> 無序清單
        </button>
        <div class="h-[1px] bg-slate-100 my-1 mx-2"></div>
        <p class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">進階內容</p>
        <button class={menuBtnClass} onclick={() => convertTo('table')}>
            <TableIcon size={16} class="text-slate-400" /> 建立表格
        </button>
        <button class={menuBtnClass} onclick={() => convertTo('blockquote')}>
            <Quote size={16} class="text-slate-400" /> 插入引言
        </button>
        <button class={menuBtnClass} onclick={() => convertTo('codeBlock')}>
            <Code2 size={16} class="text-slate-400" /> 程式碼區塊
        </button>
        <button class={menuBtnClass} onclick={() => convertTo('image')}>
            <ImageIcon size={16} class="text-slate-400" /> 插入圖片
        </button>
    </div>

    <!-- 編輯器主畫布 -->
    <div class="relative group" onmousemove={handleMouseMove} onmouseleave={() => !showBlockMenu && (showSideButtons = false)}>
        {#if showSideButtons && editable && isMounted}
            <div 
                class="absolute -left-12 flex items-center gap-0.5 transition-all duration-100 ease-out z-20"
                style="top: {sideButtonsTop}px;"
            >
                <button onclick={handleAddBlock} title="在下方新增一行" class="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                    <Plus size={18} />
                </button>
                
                <div class="relative">
                    <button 
                        draggable="true"
                        ondragstart={handleDragStart}
                        onclick={() => showBlockMenu = !showBlockMenu}
                        class="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-grab active:cursor-grabbing transition-colors"
                    >
                        <GripVertical size={18} />
                    </button>

                    {#if showBlockMenu}
                        <div class="absolute left-10 top-0 w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-40 animate-in fade-in zoom-in duration-150 text-left">
                            <button class="{menuBtnClass} text-red-500 hover:bg-red-50 font-semibold" onclick={handleDeleteBlock}>
                                <Trash2 size={16} /> 刪除
                            </button>
                            <button class="{menuBtnClass} font-semibold" onclick={handleDuplicateBlock}>
                                <Copy size={16} /> 重複製作
                            </button>
                            <div class="h-[1px] bg-slate-100 my-2 mx-1"></div>
                            <button class="{menuBtnClass} font-semibold" onclick={() => moveBlock('up')}>
                                <ArrowUp size={16} /> 向上移動
                            </button>
                            <button class="{menuBtnClass} font-semibold" onclick={() => moveBlock('down')}>
                                <ArrowDown size={16} /> 向下移動
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <div bind:this={element} class="tiptap-editor prose prose-slate max-w-none focus:outline-none" />
    </div>
</div>

<style>
    /* Tiptap 基礎與 Notion 風格 */
    :global(.tiptap-editor .ProseMirror) {
        outline: none;
        min-height: 500px;
        padding-left: 0;
    }

    /* 佔位符樣式 */
    :global(.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before) {
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
        font-style: italic;
        color: #cbd5e1;
    }

    /* Notion 風格樣式 */
    :global(.tiptap-editor h1) { font-size: 2.5rem; font-weight: 850; margin-top: 2.5rem; margin-bottom: 0.75rem; color: #0f172a; letter-spacing: -0.02em; }
    :global(.tiptap-editor h2) { font-size: 1.875rem; font-weight: 750; margin-top: 1.75rem; margin-bottom: 0.5rem; color: #1e293b; }
    :global(.tiptap-editor p) { line-height: 1.65; margin-top: 0.35rem; margin-bottom: 0.35rem; color: #334155; }

    :global(.tiptap-editor blockquote) {
        border-left: 4px solid #e2e8f0;
        padding-left: 1.5rem;
        font-style: italic;
        color: #64748b;
        margin: 1.5rem 0;
    }

    /* 程式碼區塊樣式 */
    :global(.tiptap-editor pre) {
        background: #0f172a;
        color: #f8fafc;
        border-radius: 0.75rem;
        padding: 1.25rem;
        font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        margin: 1.5rem 0;
        overflow-x: auto;
    }

    /* 表格樣式 */
    :global(.tiptap-editor table) {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        margin: 1.5rem 0;
        overflow: hidden;
    }

    :global(.tiptap-editor th, .tiptap-editor td) {
        border: 1px solid #e2e8f0;
        padding: 0.75rem;
        vertical-align: top;
        position: relative;
    }

    :global(.tiptap-editor th) {
        background-color: #f8fafc;
        font-weight: bold;
        text-align: left;
    }

    :global(.tiptap-editor .ProseMirror > *) {
        position: relative;
        padding: 6px 0;
    }

    :global(.tiptap-editor .ProseMirror-selectednode) {
        background: rgba(99, 102, 241, 0.04);
        outline: 2px solid rgba(99, 102, 241, 0.15);
        border-radius: 6px;
    }
</style>