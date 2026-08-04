<script lang="ts">
    // @ts-ignore
    import { createEventDispatcher } from 'svelte';
    import { GripVertical, Plus, Trash2 } from 'lucide-svelte';

    export let block: any;
    export let index: number;
    export let isDragging: boolean = false;

    const dispatch = createEventDispatcher();

    function onInput(e: Event) {
        const target = e.target as HTMLElement;
        dispatch('update', { id: block.id, content: target.innerText });
    }

    function onImageUpload(e: Event) {
         const target = e.target as HTMLInputElement;
         const file = target.files?.[0];
         if (file) {
             dispatch('uploadImage', { id: block.id, file });
         }
    }
</script>

<div 
    class="group relative flex items-start -ml-12 pl-12 py-1"
    class:opacity-50={isDragging}
    on:dragover|preventDefault={(e) => dispatch('dragover', { e, index })}
    on:drop|preventDefault
    role="listitem"
>
    <!-- Controls (Always visible for better UX, or hover with low opacity default) -->
    <div class="absolute -left-10 top-1.5 flex items-center space-x-1 text-gray-300 hover:text-gray-600 transition-colors">
        <button 
            class="p-0.5 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
            draggable="true"
            on:dragstart={(e) => dispatch('dragstart', { e, index })}
            title="Drag to reorder"
        >
            <GripVertical size={20} />
        </button>
        <button 
            class="p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
            on:click={() => dispatch('add', { index })}
        >
            <Plus size={18} />
        </button>
         <button 
            class="p-0.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
            on:click={() => dispatch('remove', { id: block.id })}
        >
            <Trash2 size={16} />
        </button>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
        {#if block.type === 'h1'}
            <h1 
                contenteditable="true" 
                class="text-3xl font-bold outline-none placeholder-gray-300 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300"
                data-placeholder="Heading 1"
                on:blur={onInput}
            >{@html block.content}</h1>
        {:else if block.type === 'h2'}
            <h2 
                contenteditable="true" 
                class="text-2xl font-semibold outline-none placeholder-gray-300 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300"
                data-placeholder="Heading 2"
                on:blur={onInput}
            >{@html block.content}</h2>
        {:else if block.type === 'image'}
            <div class="relative group/image">
                {#if block.content}
                    <img src={block.content} alt={block.alt || ''} class="w-full rounded-md" />
                {:else}
                    <div class="h-32 bg-gray-100 rounded-md border-2 border-dashed flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                {/if}
                 <label class="absolute inset-0 cursor-pointer opacity-0 group-hover/image:opacity-100 flex items-center justify-center bg-black/50 text-white font-medium transition-opacity rounded-md">
                    {block.content ? 'Change Image' : 'Upload Image'}
                    <input type="file" accept="image/*" class="hidden" on:change={onImageUpload} />
                </label>
            </div>
            <input 
                type="text" 
                placeholder="Image caption..." 
                class="w-full text-sm text-gray-500 mt-1 outline-none bg-transparent"
                value={block.alt || ''}
                on:input={(e) => dispatch('update', { id: block.id, alt: e.currentTarget.value })}
            />
        {:else}
            <p 
                contenteditable="true" 
                class="text-base outline-none placeholder-gray-300 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300"
                data-placeholder="Type something..."
                on:blur={onInput}
            >{@html block.content}</p>
        {/if}
    </div>
</div>
