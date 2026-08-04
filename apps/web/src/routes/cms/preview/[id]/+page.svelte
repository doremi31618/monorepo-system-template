<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { getPost, type CmsPost } from '$lib/api/cms';
    import TiptapEditor from '$lib/components/editor/TiptapEditor.svelte';

    const id = $page.params.id ?? '';
    let post: CmsPost | null = null;
    let loading = true;

    onMount(async () => {
        try {
            const res = await getPost(id);
            if (res.data) {
                post = res.data;
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen bg-white">
    {#if loading}
        <div class="flex justify-center items-center h-screen text-gray-500">Loading Preview...</div>
    {:else if post}
        <div class="max-w-4xl mx-auto py-12 px-6">
            {#if post.content?.coverImage}
                 <img src={post.content.coverImage} alt="Cover" class="w-full h-64 object-cover rounded-lg shadow-md mb-8" />
            {/if}
            
            <h1 class="text-4xl font-bold mb-4 text-gray-900">{post.content?.title || 'Untitled'}</h1>
            
            <div class="flex items-center text-gray-500 text-sm mb-8 space-x-4">
                 <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                 <span>•</span>
                 <span class="bg-gray-100 px-2 py-1 rounded">{post.status}</span>
            </div>

            <div class="prose max-w-none">
                 <TiptapEditor content={post.content?.body} editable={false} />
            </div>
        </div>
    {:else}
        <div class="text-center py-20 text-red-500">Post not found</div>
    {/if}
</div>
