<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getPosts, createPost, type CmsPost } from '$lib/api/cms';

    let posts: CmsPost[] = [];
    let loading = true;

    async function loadPosts() {
        loading = true;
        try {
            const res = await getPosts({ locale: 'en' });
            if (res.data) {
                posts = res.data.data;
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleCreatePost() {
        const title = prompt('Enter Post Title');
        if (!title) return;

        try {
            const res = await createPost(title, 'en');
            if (res.data) {
                 goto(`/admin/cms/${res.data.id}`);
            } else {
                 alert(res.message || 'Failed to create post');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating post');
        }
    }

    onMount(() => {
        loadPosts();
    });
</script>

<div class="p-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">CMS Posts</h1>
        <button 
            on:click={handleCreatePost}
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
            New Post
        </button>
    </div>

    {#if loading}
        <div class="text-gray-500">Loading...</div>
    {:else}
        <table class="w-full bg-white shadow rounded overflow-hidden">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="text-left py-3 px-4">Title</th>
                    <th class="text-left py-3 px-4">Slug</th>
                    <th class="text-left py-3 px-4">Status</th>
                    <th class="text-left py-3 px-4">Updated</th>
                    <th class="text-right py-3 px-4">Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each posts as post}
                    <tr class="border-b hover:bg-gray-50">
                        <td class="py-3 px-4 font-medium">{post.title || '(No Title)'}</td>
                        <td class="py-3 px-4 text-gray-500">{post.slug}</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 rounded text-xs {post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                {post.status}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-gray-400 text-sm">{new Date(post.updatedAt).toLocaleDateString()}</td>
                        <td class="text-right py-3 px-4">
                             <a href="/admin/cms/{post.id}" class="text-blue-600 hover:underline">Edit</a>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
         {#if posts.length === 0}
            <div class="text-center py-10 text-gray-400">No posts. Create the first one!</div>
        {/if}
    {/if}
</div>
