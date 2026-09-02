<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/stores';
    import { Loader2, Pencil, Save, Search, Trash2, X } from 'lucide-svelte';
    import {
        DataViewToolbar,
        parseDataViewQuery,
        writeDataViewQuery,
        type DataViewProperty,
        type DataViewQuery,
    } from '@platform/svelte-ui/data-view-toolbar';
    import {
        createPost,
        createTag,
        deletePost,
        deleteTag as deleteTagApi,
        getPosts,
        listTags,
        updateTag,
        type CmsPost,
        type CmsTag,
    } from '$lib/api/cms';

    let posts: CmsPost[] = [];
    let tags: CmsTag[] = [];

    let loadingPosts = true;
    let loadingTags = true;
    let deletingPostId: string | null = null;

    let searchQuery = '';
    let statusFilter = 'all';
    let tagFilter = 'all';
    let updatedFrom = '';
    let updatedTo = '';
    let dataViewQuery: DataViewQuery = { search: '', filters: [], sorts: [] };
    let postProperties: DataViewProperty[] = [];

    let tagManagerQuery = '';
    let newTagName = '';
    let creatingTag = false;
    let editingTagId: string | null = null;
    let editingTagName = '';
    let savingTagId: string | null = null;
    let deletingTagId: string | null = null;
    let filteredManagedTags: CmsTag[] = [];
    let activeTab: 'posts' | 'tags' = 'posts';

    $: filteredManagedTags = tags.filter((tag) => {
        const keyword = tagManagerQuery.trim().toLowerCase();
        if (!keyword) return true;
        return tag.name.toLowerCase().includes(keyword) || tag.slug.toLowerCase().includes(keyword);
    });
    $: postProperties = [
        {
            key: 'status',
            label: 'Status',
            type: 'enum',
            operators: ['is'],
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
            ],
        },
        {
            key: 'tagId',
            label: 'Tag',
            type: 'relation',
            operators: ['is'],
            options: tags.map((tag) => ({ value: tag.id, label: tag.name })),
        },
        { key: 'updatedAt', label: 'Updated', type: 'date', operators: ['before', 'after', 'between'], sortable: true },
        { key: 'createdAt', label: 'Created', type: 'date', operators: [], sortable: true },
        { key: 'publishedAt', label: 'Published at', type: 'date', operators: [], sortable: true },
        { key: 'title', label: 'Title', type: 'text', operators: [], sortable: true },
        { key: 'viewCount', label: 'Views', type: 'number', operators: [], sortable: true },
    ];

    function applyDataViewQuery(query: DataViewQuery) {
        searchQuery = query.search;
        const statusRule = query.filters.find((filter) => filter.property === 'status');
        statusFilter = Array.isArray(statusRule?.value) ? (statusRule.value[0] ?? 'all') : (statusRule?.value ?? 'all');
        const tagRule = query.filters.find((filter) => filter.property === 'tagId');
        tagFilter = Array.isArray(tagRule?.value) ? (tagRule.value[0] ?? 'all') : (tagRule?.value ?? 'all');
        const updatedRule = query.filters.find((filter) => filter.property === 'updatedAt');
        updatedFrom = updatedRule?.operator === 'after'
            ? String(updatedRule.value)
            : updatedRule?.operator === 'between' && Array.isArray(updatedRule.value)
                ? (updatedRule.value[0] ?? '')
                : '';
        updatedTo = updatedRule?.operator === 'before'
            ? String(updatedRule.value)
            : updatedRule?.operator === 'between' && Array.isArray(updatedRule.value)
                ? (updatedRule.value[1] ?? '')
                : '';
    }

    async function handleDataViewQueryChange(next: DataViewQuery) {
        dataViewQuery = next;
        applyDataViewQuery(next);
        const params = writeDataViewQuery($page.url.searchParams, next);
        await goto(`${resolve('/admin/cms')}?${params.toString()}`, {
            replaceState: true,
            noScroll: true,
            keepFocus: true,
        });
        await loadPosts();
    }

    async function loadTags() {
        loadingTags = true;
        try {
            const res = await listTags();
            tags = res.data?.data ?? [];
        } catch (error) {
            console.error(error);
            tags = [];
        } finally {
            loadingTags = false;
        }
    }

    async function loadPosts() {
        loadingPosts = true;
        try {
            const res = await getPosts({
                locale: 'en',
                query: searchQuery,
                status: statusFilter,
                tagId: tagFilter,
                updatedFrom,
                updatedTo,
                sort: dataViewQuery.sorts.map((sort) => `${sort.property}:${sort.direction}`),
            });
            posts = res.data?.data ?? [];
        } catch (error) {
            console.error(error);
            posts = [];
        } finally {
            loadingPosts = false;
        }
    }

    async function handleCreatePost() {
        const title = prompt('Enter Post Title');
        if (!title) return;

        try {
            const res = await createPost(title, 'en');
            if (res.data) {
                goto(resolve(`/admin/cms/${res.data.id}`));
            } else {
                alert(res.message || 'Failed to create post');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating post');
        }
    }

    async function handleDeletePost(post: CmsPost) {
        const title = post.title || post.slug || 'this post';
        const confirmed = window.confirm(`Delete "${title}"? This action cannot be undone.`);
        if (!confirmed) return;

        deletingPostId = post.id;
        try {
            await deletePost(post.id);
            posts = posts.filter((item) => item.id !== post.id);
        } catch (error) {
            console.error(error);
            alert('Failed to delete post');
        } finally {
            deletingPostId = null;
        }
    }

    async function handleSearchSubmit() {
        await loadPosts();
    }

    async function handleResetFilters() {
        searchQuery = '';
        statusFilter = 'all';
        tagFilter = 'all';
        updatedFrom = '';
        updatedTo = '';
        await loadPosts();
    }

    function getTagDisplay(post: CmsPost) {
        const postTags = post.tags ?? [];
        if (postTags.length === 0) return '-';
        return postTags.map((tag) => tag.name).join(', ');
    }

    async function handleCreateTag() {
        const name = newTagName.trim();
        if (!name) return;

        creatingTag = true;
        try {
            const res = await createTag(name);
            const created = res.data;
            if (!created) return;

            const exists = tags.some((tag) => tag.id === created.id);
            if (!exists) {
                tags = [...tags, created].sort((a, b) => a.name.localeCompare(b.name));
            }
            newTagName = '';
        } catch (error) {
            console.error(error);
            alert('Failed to create tag');
        } finally {
            creatingTag = false;
        }
    }

    function startEditTag(tag: CmsTag) {
        editingTagId = tag.id;
        editingTagName = tag.name;
    }

    function cancelEditTag() {
        editingTagId = null;
        editingTagName = '';
    }

    async function handleSaveTag(tag: CmsTag) {
        if (!editingTagId) return;
        const nextName = editingTagName.trim();
        if (!nextName) return;

        savingTagId = tag.id;
        try {
            const res = await updateTag(tag.id, { name: nextName });
            const updated = res.data;
            if (!updated) return;

            tags = tags.map((current) => (current.id === tag.id ? { ...current, ...updated } : current));
            cancelEditTag();
        } catch (error) {
            console.error(error);
            alert('Failed to update tag');
        } finally {
            savingTagId = null;
        }
    }

    async function handleDeleteTag(tag: CmsTag) {
        const confirmed = window.confirm(`Delete tag "${tag.name}"?`);
        if (!confirmed) return;

        deletingTagId = tag.id;
        try {
            await deleteTagApi(tag.id);
            tags = tags.filter((current) => current.id !== tag.id);
            if (tagFilter === tag.id) {
                tagFilter = 'all';
                await loadPosts();
            }
        } catch (error) {
            console.error(error);
            alert('Failed to delete tag');
        } finally {
            deletingTagId = null;
        }
    }

    onMount(async () => {
        await loadTags();
        dataViewQuery = parseDataViewQuery($page.url.searchParams, postProperties);
        applyDataViewQuery(dataViewQuery);
        await loadPosts();
    });
</script>

<div class="p-6">
    <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">CMS Management</h1>
        {#if activeTab === 'posts'}
            <button
                on:click={handleCreatePost}
                class="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
                New Post
            </button>
        {/if}
    </div>

    <div class="mb-4 inline-flex rounded-lg border bg-card p-1 text-card-foreground shadow-sm">
        <button
            class={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'posts' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            on:click={() => (activeTab = 'posts')}
        >
            Post List
        </button>
        <button
            class={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'tags' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            on:click={() => (activeTab = 'tags')}
        >
            Tag List
        </button>
    </div>

    {#if activeTab === 'posts'}
        <div class="mb-4 border-y py-2">
            <DataViewToolbar
                properties={postProperties}
                query={dataViewQuery}
                searchLabel="Search posts"
                searchPlaceholder="Search title or slug…"
                onquerychange={handleDataViewQueryChange}
            />
        </div>

        {#if loadingPosts}
            <div class="text-muted-foreground">Loading posts...</div>
        {:else}
            <table class="w-full overflow-hidden rounded bg-card text-card-foreground shadow" data-theme-surface>
                <thead class="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                        <th class="px-4 py-3 text-left">Title</th>
                        <th class="px-4 py-3 text-left">Slug</th>
                        <th class="px-4 py-3 text-left">Status</th>
                        <th class="px-4 py-3 text-left">Tags</th>
                        <th class="px-4 py-3 text-left">Views</th>
                        <th class="px-4 py-3 text-left">Updated</th>
                        <th class="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each posts as post (post.id)}
                        <tr class="border-b hover:bg-muted/50">
                            <td class="px-4 py-3 font-medium">{post.title || '(No Title)'}</td>
                            <td class="px-4 py-3 text-muted-foreground">{post.slug}</td>
                            <td class="px-4 py-3">
                                <span class={`rounded px-2 py-1 text-xs ${
                                    post.status === 'published'
                                        ? 'bg-primary/10 text-primary'
                                        : post.status === 'archived'
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-secondary text-secondary-foreground'
                                }`}>
                                    {post.status}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-muted-foreground">{getTagDisplay(post)}</td>
                            <td class="px-4 py-3 text-sm text-muted-foreground">{post.viewCount ?? 0}</td>
                            <td class="px-4 py-3 text-sm text-muted-foreground">{new Date(post.updatedAt).toLocaleDateString()}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <a
                                        href={resolve(`/admin/cms/${post.id}`)}
                                        class="inline-flex h-8 w-8 items-center justify-center rounded text-primary transition-colors hover:bg-accent"
                                        aria-label="Edit post"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </a>
                                    <button
                                        class="inline-flex h-8 w-8 items-center justify-center rounded text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                                        disabled={deletingPostId === post.id}
                                        on:click={() => handleDeletePost(post)}
                                        aria-label="Delete post"
                                        title="Delete"
                                    >
                                        {#if deletingPostId === post.id}
                                            <Loader2 size={16} class="animate-spin" />
                                        {:else}
                                            <Trash2 size={16} />
                                        {/if}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            {#if posts.length === 0}
                <div class="py-10 text-center text-muted-foreground">No posts found.</div>
            {/if}
        {/if}
    {:else}
        <div class="rounded border bg-card p-4 text-card-foreground shadow-sm" data-theme-surface>
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold">CMS Tags</h2>
                {#if loadingTags}
                    <Loader2 size={16} class="animate-spin text-muted-foreground" />
                {/if}
            </div>

            <div class="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                <div class="relative">
                    <Search size={16} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        class="w-full rounded border border-input bg-background px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                        placeholder="Search tags by name or slug"
                        bind:value={tagManagerQuery}
                    />
                </div>
                <div class="flex items-center gap-2">
                    <input
                        class="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                        placeholder="New tag name"
                        bind:value={newTagName}
                    />
                    <button
                        class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        on:click={handleCreateTag}
                        disabled={creatingTag}
                    >
                        {creatingTag ? 'Creating...' : 'Add'}
                    </button>
                </div>
            </div>

            <table class="w-full overflow-hidden rounded border">
                <thead class="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                        <th class="px-3 py-2 text-left text-sm">Name</th>
                        <th class="px-3 py-2 text-left text-sm">Slug</th>
                        <th class="px-3 py-2 text-left text-sm">Posts</th>
                        <th class="px-3 py-2 text-left text-sm">Views</th>
                        <th class="px-3 py-2 text-right text-sm">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredManagedTags as tag (tag.id)}
                        <tr class="border-b hover:bg-muted/50">
                            <td class="px-3 py-2 text-sm">
                                {#if editingTagId === tag.id}
                                    <input class="w-full rounded border border-input bg-background px-2 py-1 text-foreground" bind:value={editingTagName} />
                                {:else}
                                    {tag.name}
                                {/if}
                            </td>
                            <td class="px-3 py-2 text-sm text-muted-foreground">{tag.slug}</td>
                            <td class="px-3 py-2 text-sm text-muted-foreground">{tag.postCount ?? 0}</td>
                            <td class="px-3 py-2 text-sm text-muted-foreground">{tag.totalViews ?? 0}</td>
                            <td class="px-3 py-2 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    {#if editingTagId === tag.id}
                                        <button
                                            class="inline-flex h-8 w-8 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                            on:click={() => handleSaveTag(tag)}
                                            disabled={savingTagId === tag.id}
                                            title="Save"
                                        >
                                            {#if savingTagId === tag.id}
                                                <Loader2 size={16} class="animate-spin" />
                                            {:else}
                                                <Save size={16} />
                                            {/if}
                                        </button>
                                        <button class="inline-flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-100" on:click={cancelEditTag} title="Cancel">
                                            <X size={16} />
                                        </button>
                                    {:else}
                                        <button
                                            class="inline-flex h-8 w-8 items-center justify-center rounded text-blue-600 hover:bg-blue-50"
                                            on:click={() => startEditTag(tag)}
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            class="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            on:click={() => handleDeleteTag(tag)}
                                            disabled={deletingTagId === tag.id}
                                            title="Delete"
                                        >
                                            {#if deletingTagId === tag.id}
                                                <Loader2 size={16} class="animate-spin" />
                                            {:else}
                                                <Trash2 size={16} />
                                            {/if}
                                        </button>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            {#if filteredManagedTags.length === 0}
                <div class="py-6 text-center text-sm text-muted-foreground">No tags found.</div>
            {/if}
        </div>
    {/if}
</div>
