<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import BlockRenderer from './BlockRenderer.svelte';
    import { uploadAsset } from '$lib/services/upload.service';

    export let blocks: any[] = [];
    export let editable = true;

    const dispatch = createEventDispatcher();
    let draggedIndex: number | null = null;

    // --- Actions ---

    function addBlock(index: number, type: 'p' | 'h1' | 'h2' | 'image' = 'p') {
        const newBlock = {
            id: uuidv4(),
            type,
            content: '',
        };
        // Splice into array at index + 1
        blocks.splice(index + 1, 0, newBlock);
        blocks = blocks;
        dispatch('change', { blocks });
    }

    function removeBlock(id: string) {
        blocks = blocks.filter(b => b.id !== id);
        if (blocks.length === 0) {
            // Always keep one block
            addBlock(-1); 
        } else {
             dispatch('change', { blocks });
        }
    }

    function updateBlock(id: string, updates: any) {
        const idx = blocks.findIndex(b => b.id === id);
        if (idx !== -1) {
            blocks[idx] = { ...blocks[idx], ...updates };
            blocks = blocks;
            dispatch('change', { blocks });
        }
    }

    async function handleImageUpload(id: string, file: File) {
         try {
             // Use our upload service
             const asset = await uploadAsset({ file });
             // Fetch URL (assumption same as Tiptap logic)
             const { getDownloadUrl } = await import('$lib/api/assets');
             const urlRes = await getDownloadUrl(asset.id);

             const downloadUrl = urlRes.data?.url ?? (urlRes as { url?: string }).url;

             if (downloadUrl) {
                 updateBlock(id, { content: downloadUrl });
             }
         } catch (e) {
             console.error(e);
             alert('Upload failed');
         }
    }

    // --- Drag & Drop ---

    function handleDragStart(e: DragEvent, index: number) {
        draggedIndex = index;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index.toString()); // Required for drag to start
            e.dataTransfer.setDragImage(e.target as Element, 0, 0); // Improve drag visuals
        }
    }

    function handleDragOver(e: DragEvent, index: number) {
        if (draggedIndex === null || draggedIndex === index) return;
        
        // Reorder
        const item = blocks[draggedIndex];
        blocks.splice(draggedIndex, 1);
        blocks.splice(index, 0, item);
        blocks = blocks;
        
        draggedIndex = index; // Update dragged index to new position
    }

    // Initialize if empty
    if (blocks.length === 0) {
        addBlock(-1);
    }
</script>

<div class="max-w-3xl mx-auto py-8">
    <div class="space-y-1">
        {#each blocks as block, index (block.id)}
            <BlockRenderer 
                {block} 
                {index}
                isDragging={draggedIndex === index}
                on:update={(e) => updateBlock(e.detail.id, e.detail)}
                on:add={(e) => {
                     // Quick Insert Popover Logic could go here. 
                     // For now, simple prompt or default to 'p' then allow switch?
                     // Or just cycle? 
                     // Let's implement a simple "slash menu" simulation or just add paragraph by default.
                     // The user spec mentions "Menu". 
                     // For MVP experiment, let's just add 'p'.
                     addBlock(e.detail.index);
                }}
                on:remove={(e) => removeBlock(e.detail.id)}
                on:uploadImage={(e) => handleImageUpload(e.detail.id, e.detail.file)}
                on:dragstart={(e) => handleDragStart(e.detail.e, e.detail.index)}
                on:dragover={(e) => handleDragOver(e.detail.e, e.detail.index)}
            />
        {/each}
    </div>
    
    <!-- Bottom Add Button -->
    <div class="mt-4 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
        <div class="flex space-x-2">
            <button class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm" on:click={() => addBlock(blocks.length - 1, 'p')}>+ Text</button>
            <button class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm" on:click={() => addBlock(blocks.length - 1, 'h1')}>+ H1</button>
            <button class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm" on:click={() => addBlock(blocks.length - 1, 'h2')}>+ H2</button>
            <button class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm" on:click={() => addBlock(blocks.length - 1, 'image')}>+ Image</button>
        </div>
    </div>
</div>
