<script lang="ts">
    import { page } from '$app/stores';
    import { resolve } from '$app/paths';
    import { onMount } from 'svelte';
    import { Loader2, Search, Settings } from 'lucide-svelte';
    import * as Sheet from '@platform/ui/sheet';
    import {
        createTag,
        getPost,
        getLinkPreview,
        listTags,
        updatePostContent,
        updatePostStatus,
        updatePostTags,
        type CmsPost,
        type CmsTag,
    } from '$lib/api/cms';
    import AssetPickerModal from '$lib/components/assets/AssetPickerModal.svelte';
    import TiptapEditor from '$lib/components/editor/TiptapEditor.svelte';
    import { extractTocFromTiptap, hasTableOfContentsNode, type TocItem } from '$lib/features/cms/toc';

    const id = $page.params.id ?? '';

    let post: CmsPost | null = null;
    let content: unknown = {};
    let locale = 'en';
    let loading = true;
    let saving = false;
    let isSettingsDrawerOpen = false;
    let slugInput = '';

    let availableTags: CmsTag[] = [];
    let selectedTagIds: string[] = [];
    let loadingTags = false;
    let tagQuery = '';
    let newTagName = '';
    let creatingTag = false;

    let isAssetPickerOpen = false;
    let assetPickerMode: 'cover' | 'editor' = 'cover';
    let editorImageResolver: ((url: string | null) => void) | null = null;
    let tocItems: TocItem[] = [];
    let hasTocBlock = false;

    $: if (!isAssetPickerOpen && assetPickerMode === 'editor' && editorImageResolver) {
        editorImageResolver(null);
        editorImageResolver = null;
    }

    $: tocItems = extractTocFromTiptap(content);
    $: hasTocBlock = hasTableOfContentsNode(content);

    function setEditorContent(nextContent: unknown) {
        content = nextContent;
    }

    function scrollToHeading(index: number) {
        const headings = Array.from(
            document.querySelectorAll('.tiptap-editor .ProseMirror h1, .tiptap-editor .ProseMirror h2, .tiptap-editor .ProseMirror h3')
        ) as HTMLElement[];
        const target = headings[index];
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function ensurePostContent() {
        if (!post) return null;
        if (!post.content) {
            post.content = {};
        }
        return post.content;
    }

    function resolveUpdatedPostFromStatusResponse(
        payload: CmsPost | CmsPost[] | undefined
    ): CmsPost | null {
        if (!payload) return null;
        if (Array.isArray(payload)) {
            return payload[0] ?? null;
        }
        return payload;
    }

    function getTagDisplayName(tagId: string) {
        const fromAvailable = availableTags.find((tag) => tag.id === tagId);
        if (fromAvailable) return fromAvailable.name;

        const fromPost = post?.tags?.find((tag) => tag.id === tagId);
        if (fromPost) return fromPost.name;

        return tagId.slice(0, 8);
    }

    function toggleTag(tagId: string) {
        if (selectedTagIds.includes(tagId)) {
            selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
            return;
        }

        selectedTagIds = [...selectedTagIds, tagId];
    }

    async function loadTagOptions(query: string = tagQuery) {
        loadingTags = true;
        try {
            const res = await listTags({ query });
            availableTags = res.data?.data ?? [];
        } catch (error) {
            console.error(error);
            availableTags = [];
        } finally {
            loadingTags = false;
        }
    }

    async function loadPost() {
        loading = true;
        try {
            const res = await getPost(id, locale);
            if (res.data) {
                post = res.data;
                content = post.content?.body ?? {};
                selectedTagIds = post.tags?.map((tag) => tag.id) ?? [];
                slugInput = post.slug;
            }
        } catch (error) {
            console.error(error);
        } finally {
            loading = false;
        }
    }

    async function handleSave() {
        if (!post) return;

        saving = true;
        try {
            const statusRes = await updatePostStatus(post.id, post.status, slugInput || post.slug);
            const updatedPost = resolveUpdatedPostFromStatusResponse(statusRes.data);
            if (updatedPost) {
                post.status = updatedPost.status;
                post.slug = updatedPost.slug;
                slugInput = updatedPost.slug;
            }

            await updatePostContent(id, locale, {
                title: post.content?.title || 'Untitled',
                body: content,
                seoTitle: post.content?.seoTitle,
                seoDesc: post.content?.seoDesc,
                coverImage: post.content?.coverImage,
            });

            await updatePostTags(id, locale, selectedTagIds);
            await loadPost();
            alert('Saved successfully');
        } catch (error) {
            console.error(error);
            alert('Error saving post');
        } finally {
            saving = false;
        }
    }

    async function handleStatusChange(event: Event) {
        if (!post) return;

        const target = event.currentTarget as HTMLSelectElement;
        const newStatus = target.value;
        try {
            const res = await updatePostStatus(post.id, newStatus, slugInput || post.slug);
            const updatedPost = resolveUpdatedPostFromStatusResponse(res.data);
            if (updatedPost) {
                post.status = updatedPost.status;
                post.slug = updatedPost.slug;
                slugInput = updatedPost.slug;
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        }
    }

    function handleSlugInput(event: Event) {
        slugInput = (event.currentTarget as HTMLInputElement).value;
    }

    async function handleCreateTag() {
        const name = newTagName.trim();
        if (!name) return;

        creatingTag = true;
        try {
            const res = await createTag(name);
            const createdTag = res.data;
            if (!createdTag) return;

            const exists = availableTags.some((tag) => tag.id === createdTag.id);
            if (!exists) {
                availableTags = [...availableTags, createdTag].sort((a, b) => a.name.localeCompare(b.name));
            }

            if (!selectedTagIds.includes(createdTag.id)) {
                selectedTagIds = [...selectedTagIds, createdTag.id];
            }

            newTagName = '';
        } catch (error) {
            console.error(error);
            alert('Failed to create tag');
        } finally {
            creatingTag = false;
        }
    }

    function clearCoverImage() {
        const currentContent = ensurePostContent();
        if (!currentContent) return;
        currentContent.coverImage = undefined;
    }

    async function requestLinkPreview(url: string) {
        try {
            const res = await getLinkPreview(url);
            return res.data ?? null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    function openCoverImagePicker() {
        assetPickerMode = 'cover';
        isAssetPickerOpen = true;
    }

    function requestEditorImage() {
        assetPickerMode = 'editor';
        isAssetPickerOpen = true;
        return new Promise<string | null>((resolve) => {
            editorImageResolver = resolve;
        });
    }

    function handleAssetSelect(event: CustomEvent<{ url: string }>) {
        const url = event.detail.url;

        if (assetPickerMode === 'editor') {
            if (editorImageResolver) {
                editorImageResolver(url);
                editorImageResolver = null;
            }
            isAssetPickerOpen = false;
            return;
        }

        if (!post) return;
        if (!post.content) post.content = {};
        post.content.coverImage = url;
        isAssetPickerOpen = false;
    }

    function handleSeoTitleInput(event: Event) {
        const currentContent = ensurePostContent();
        if (!currentContent) return;
        currentContent.seoTitle = (event.currentTarget as HTMLInputElement).value;
    }

    function handleSeoDescInput(event: Event) {
        const currentContent = ensurePostContent();
        if (!currentContent) return;
        currentContent.seoDesc = (event.currentTarget as HTMLTextAreaElement).value;
    }

    onMount(async () => {
        await Promise.all([
            loadPost(),
            loadTagOptions(),
        ]);
    });
</script>

<div class="flex h-[calc(100vh-64px)] overflow-hidden">
    <div class="flex min-w-0 flex-1 flex-col bg-white">
        <header class="flex flex-col gap-3 border-b px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
            <div class="mr-4 flex-1">
                <input
                    type="text"
                    class="w-full border-none text-2xl font-bold placeholder-gray-300 focus:outline-none"
                    placeholder="Post Title"
                    value={post?.content?.title || ''}
                    on:input={(event) => {
                        if (!post) return;
                        if (!post.content) post.content = {};
                        post.content.title = (event.currentTarget as HTMLInputElement).value;
                    }}
                />
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
                <select bind:value={locale} on:change={loadPost} class="rounded border bg-white px-2 py-1 text-sm">
                    <option value="en">English</option>
                    <option value="zh-TW">Traditional Chinese</option>
                </select>
                <a href={resolve(`/cms/preview/${id}`)} target="_blank" class="rounded border px-4 py-2 text-sm hover:bg-gray-100">
                    Preview
                </a>
                {#if post?.slug}
                    <a href={resolve(`/blog/${post.slug}`)} target="_blank" class="rounded border px-4 py-2 text-sm hover:bg-gray-100">
                        Public Page
                    </a>
                {/if}
                <button
                    class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={saving}
                    on:click={handleSave}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>

                <Sheet.Root bind:open={isSettingsDrawerOpen}>
                    <Sheet.Trigger
                        class="inline-flex h-9 w-9 items-center justify-center rounded border bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
                        aria-label="Open settings"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </Sheet.Trigger>
                    <Sheet.Content side="right" class="w-[90vw] max-w-sm overflow-y-auto p-4 sm:p-5 lg:hidden">
                        <h3 class="mb-4 font-semibold text-gray-700">Settings</h3>

                        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
                            <label class="mb-2 block text-sm font-medium text-gray-600">Status</label>
                            <select class="w-full rounded border bg-white px-3 py-2" value={post?.status} on:change={handleStatusChange}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
                            <label class="mb-2 block text-sm font-medium text-gray-600">Cover Image</label>
                            {#if post?.content?.coverImage}
                                <div class="group relative mb-2">
                                    <img src={post.content.coverImage} alt="Cover" class="h-32 w-full rounded border object-cover" />
                                    <button
                                        class="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow-sm transition group-hover:opacity-100"
                                        on:click={clearCoverImage}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            {/if}
                            <button
                                class="w-full rounded border-2 border-dashed border-gray-300 p-2 text-center text-sm text-gray-500 hover:bg-gray-50"
                                on:click={openCoverImagePicker}
                            >
                                {post?.content?.coverImage ? 'Change Image' : 'Choose Image'}
                            </button>
                        </div>

                        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
                            <div class="mb-2 flex items-center justify-between">
                                <h4 class="text-sm font-medium text-gray-700">Tags</h4>
                                {#if loadingTags}
                                    <Loader2 size={14} class="animate-spin text-gray-400" />
                                {/if}
                            </div>

                            <div class="mb-2 flex items-center gap-2">
                                <div class="relative flex-1">
                                    <Search size={14} class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        class="w-full rounded border px-2 py-2 pl-7 text-sm"
                                        placeholder="Search tags"
                                        bind:value={tagQuery}
                                    />
                                </div>
                                <button class="rounded border px-3 py-2 text-sm hover:bg-gray-50" on:click={() => loadTagOptions()}>
                                    Search
                                </button>
                            </div>

                            <div class="mb-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    class="flex-1 rounded border px-2 py-2 text-sm"
                                    placeholder="New tag"
                                    bind:value={newTagName}
                                />
                                <button
                                    class="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                                    disabled={creatingTag}
                                    on:click={handleCreateTag}
                                >
                                    {creatingTag ? '...' : 'Add'}
                                </button>
                            </div>

                            <div class="max-h-40 overflow-y-auto rounded border bg-gray-50 p-2">
                                {#if availableTags.length === 0}
                                    <div class="px-1 py-2 text-xs text-gray-400">No tags</div>
                                {:else}
                                    <div class="flex flex-wrap gap-2">
                                        {#each availableTags as tag (tag.id)}
                                            <button
                                                class={`rounded-full border px-2 py-1 text-xs ${
                                                    selectedTagIds.includes(tag.id)
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-gray-300 bg-white text-gray-600'
                                                }`}
                                                on:click={() => toggleTag(tag.id)}
                                            >
                                                {tag.name}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                            <div class="mt-3 flex flex-wrap gap-2">
                                {#if selectedTagIds.length === 0}
                                    <span class="text-xs text-gray-400">No selected tags</span>
                                {:else}
                                    {#each selectedTagIds as tagId (tagId)}
                                        <button class="rounded-full bg-slate-800 px-2 py-1 text-xs text-white" on:click={() => toggleTag(tagId)}>
                                            {getTagDisplayName(tagId)} ×
                                        </button>
                                    {/each}
                                {/if}
                            </div>
                        </div>

                        <div class="mb-6 rounded border bg-white p-4 shadow-sm space-y-4">
                            <h4 class="border-b pb-2 font-medium text-gray-700">SEO Settings</h4>
                            <div>
                                <label class="mb-1 block text-sm font-medium text-gray-600">SEO Title</label>
                                <input
                                    type="text"
                                    class="w-full rounded border px-3 py-2 text-sm"
                                    value={post?.content?.seoTitle || ''}
                                    on:input={handleSeoTitleInput}
                                />
                            </div>
                            <div>
                                <label class="mb-1 block text-sm font-medium text-gray-600">SEO Description</label>
                                <textarea
                                    class="h-24 w-full rounded border px-3 py-2 text-sm"
                                    value={post?.content?.seoDesc || ''}
                                    on:input={handleSeoDescInput}
                                ></textarea>
                            </div>
                        </div>

                        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
                            <label class="mb-1 block text-sm font-medium text-gray-600">Slug</label>
                            <input
                                type="text"
                                class="w-full rounded border bg-white px-3 py-2 text-sm"
                                placeholder="post-slug"
                                value={slugInput}
                                on:input={handleSlugInput}
                            />
                        </div>
                    </Sheet.Content>
                </Sheet.Root>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div class="relative mx-auto min-h-full max-w-[1100px]">
                <div class="min-h-full max-w-4xl rounded-lg bg-white p-6 shadow-sm">
                    {#if !loading && post}
                        <TiptapEditor
                            content={content}
                            onchange={setEditorContent}
                            onRequestImage={requestEditorImage}
                            onRequestLinkPreview={requestLinkPreview}
                        />
                    {:else}
                        <div class="p-10 text-center text-gray-500">Loading...</div>
                    {/if}
                </div>

                {#if hasTocBlock}
                    <aside class="group absolute right-0 top-8 hidden items-start lg:flex">
                        <div class="flex h-28 w-6 items-center justify-center rounded-l border border-r-0 border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                            TOC
                        </div>
                        <div class="max-h-[70vh] w-0 overflow-hidden rounded-r border border-slate-200 bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:w-64 group-hover:opacity-100">
                            <div class="border-b px-3 py-2 text-xs font-semibold text-slate-600">Table of contents</div>
                            <div class="space-y-1 p-2">
                                {#if tocItems.length === 0}
                                    <p class="px-2 py-2 text-xs text-slate-400">Add heading blocks to generate a TOC.</p>
                                {:else}
                                    {#each tocItems as item, index (item.id)}
                                        <button
                                            class="block w-full rounded px-2 py-1 text-left text-xs text-slate-600 hover:bg-slate-100"
                                            style="padding-left: {item.level === 1 ? '0.5rem' : item.level === 2 ? '1rem' : '1.5rem'}"
                                            on:click={() => scrollToHeading(index)}
                                        >
                                            {item.text}
                                        </button>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    </aside>
                {/if}
            </div>
        </div>
    </div>

    <div class="hidden w-80 overflow-y-auto border-l bg-gray-50 p-4 lg:block">
        <h3 class="mb-4 font-semibold text-gray-700">Settings</h3>

        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
            <label class="mb-2 block text-sm font-medium text-gray-600">Status</label>
            <select class="w-full rounded border bg-white px-3 py-2" value={post?.status} on:change={handleStatusChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
            </select>
        </div>

        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
            <label class="mb-2 block text-sm font-medium text-gray-600">Cover Image</label>
            {#if post?.content?.coverImage}
                <div class="group relative mb-2">
                    <img src={post.content.coverImage} alt="Cover" class="h-32 w-full rounded border object-cover" />
                    <button
                        class="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow-sm transition group-hover:opacity-100"
                        on:click={clearCoverImage}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            {/if}
            <button
                class="w-full rounded border-2 border-dashed border-gray-300 p-2 text-center text-sm text-gray-500 hover:bg-gray-50"
                on:click={openCoverImagePicker}
            >
                {post?.content?.coverImage ? 'Change Image' : 'Choose Image'}
            </button>
        </div>

        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
            <div class="mb-2 flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-700">Tags</h4>
                {#if loadingTags}
                    <Loader2 size={14} class="animate-spin text-gray-400" />
                {/if}
            </div>

            <div class="mb-2 flex items-center gap-2">
                <div class="relative flex-1">
                    <Search size={14} class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        class="w-full rounded border px-2 py-2 pl-7 text-sm"
                        placeholder="Search tags"
                        bind:value={tagQuery}
                    />
                </div>
                <button class="rounded border px-3 py-2 text-sm hover:bg-gray-50" on:click={() => loadTagOptions()}>
                    Search
                </button>
            </div>

            <div class="mb-3 flex items-center gap-2">
                <input
                    type="text"
                    class="flex-1 rounded border px-2 py-2 text-sm"
                    placeholder="New tag"
                    bind:value={newTagName}
                />
                <button
                    class="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={creatingTag}
                    on:click={handleCreateTag}
                >
                    {creatingTag ? '...' : 'Add'}
                </button>
            </div>

            <div class="max-h-40 overflow-y-auto rounded border bg-gray-50 p-2">
                {#if availableTags.length === 0}
                    <div class="px-1 py-2 text-xs text-gray-400">No tags</div>
                {:else}
                    <div class="flex flex-wrap gap-2">
                        {#each availableTags as tag (tag.id)}
                            <button
                                class={`rounded-full border px-2 py-1 text-xs ${
                                    selectedTagIds.includes(tag.id)
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 bg-white text-gray-600'
                                }`}
                                on:click={() => toggleTag(tag.id)}
                            >
                                {tag.name}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
                {#if selectedTagIds.length === 0}
                    <span class="text-xs text-gray-400">No selected tags</span>
                {:else}
                    {#each selectedTagIds as tagId (tagId)}
                        <button class="rounded-full bg-slate-800 px-2 py-1 text-xs text-white" on:click={() => toggleTag(tagId)}>
                            {getTagDisplayName(tagId)} ×
                        </button>
                    {/each}
                {/if}
            </div>
        </div>

        <div class="mb-6 space-y-4 rounded border bg-white p-4 shadow-sm">
            <h4 class="border-b pb-2 font-medium text-gray-700">SEO Settings</h4>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-600">SEO Title</label>
                <input
                    type="text"
                    class="w-full rounded border px-3 py-2 text-sm"
                    value={post?.content?.seoTitle || ''}
                    on:input={handleSeoTitleInput}
                />
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium text-gray-600">SEO Description</label>
                <textarea
                    class="h-24 w-full rounded border px-3 py-2 text-sm"
                    value={post?.content?.seoDesc || ''}
                    on:input={handleSeoDescInput}
                ></textarea>
            </div>
        </div>

        <div class="mb-6 rounded border bg-white p-4 shadow-sm">
            <label class="mb-1 block text-sm font-medium text-gray-600">Slug</label>
            <input
                type="text"
                class="w-full rounded border bg-white px-3 py-2 text-sm"
                placeholder="post-slug"
                value={slugInput}
                on:input={handleSlugInput}
            />
        </div>
    </div>
</div>

<AssetPickerModal
    bind:open={isAssetPickerOpen}
    title={assetPickerMode === 'cover' ? 'Select Cover Image' : 'Insert Image'}
    mimePrefix="image/"
    on:select={handleAssetSelect}
    on:cancel={() => {
        isAssetPickerOpen = false;
    }}
/>
