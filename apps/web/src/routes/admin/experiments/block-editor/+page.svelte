<script lang="ts">
    import BlockEditor from '$lib/components/block-editor/BlockEditor.svelte';

    let blocks = [
        { id: '1', type: 'h1', content: 'Welcome to Block Editor' },
        { id: '2', type: 'p', content: 'This is a Notion-like block editor experiment.' },
        { id: '3', type: 'p', content: 'Try dragging blocks by the handle on the left!' },
    ];

    function handleChange(e: CustomEvent) {
        blocks = e.detail.blocks;
    }
</script>

<div class="min-h-screen bg-white">
    <header class="border-b px-8 py-4 flex justify-between items-center bg-gray-50">
        <h1 class="text-xl font-bold">Experiment: Block Editor</h1>
        <div class="text-sm text-gray-500">
            {blocks.length} blocks
        </div>
    </header>

    <main class="max-w-4xl mx-auto py-12 px-6">
        <BlockEditor {blocks} on:change={handleChange} />
        
        <!-- Debug View -->
        <div class="mt-20 p-4 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(blocks, null, 2)}
        </div>
    </main>
</div>
