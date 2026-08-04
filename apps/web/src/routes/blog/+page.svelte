<script lang="ts">
    import { page } from '$app/stores';
    import { resolve } from '$app/paths';
    import { onMount } from 'svelte';
    import { listPublicPosts, type PublicCmsPostSummary } from '$lib/api/cms';

    let posts: PublicCmsPostSummary[] = [];
    let loading = true;
    let query = '';
    let tagSlug = '';
    let currentPage = 1;
    let limit = 9;
    let total = 0;

    $: totalPages = Math.max(1, Math.ceil((total || 0) / limit));

    async function loadPosts() {
        loading = true;
        try {
            const res = await listPublicPosts({
                page: currentPage,
                limit,
                query,
                tagSlug: tagSlug || undefined,
                sort: 'latest',
            });
            posts = res.data?.data ?? [];
            total = res.data?.total ?? posts.length;
        } catch (error) {
            console.error(error);
            posts = [];
            total = 0;
        } finally {
            loading = false;
        }
    }

    async function submitSearch() {
        currentPage = 1;
        await loadPosts();
    }

    async function goToPage(page: number) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        await loadPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onMount(async () => {
        tagSlug = $page.url.searchParams.get('tag') ?? '';
        await loadPosts();
    });
</script>

<div class="min-h-screen bg-slate-50">
    <header class="border-b bg-white">
        <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
            <a href={resolve('/')} class="text-lg font-bold text-slate-900">Content Hub</a>
            <span class="text-sm text-slate-500">Blog</span>
        </div>
    </header>

    <main class="mx-auto w-full max-w-6xl px-6 py-10">
        <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex flex-col gap-3 md:flex-row">
                <input
                    class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    placeholder="Search posts by title or keyword"
                    bind:value={query}
                    on:keydown={(event) => event.key === 'Enter' && submitSearch()}
                />
                {#if tagSlug}
                    <button class="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100" on:click={() => { tagSlug = ''; submitSearch(); }}>
                        Tag: {tagSlug} ×
                    </button>
                {/if}
                <button class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" on:click={submitSearch}>
                    Search
                </button>
            </div>
        </section>

        {#if loading}
            <div class="py-24 text-center text-slate-500">Loading posts...</div>
        {:else if posts.length === 0}
            <div class="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-400">
                No published posts found.
            </div>
        {:else}
            <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {#each posts as post (post.id)}
                    <a href={resolve(`/blog/${post.slug}`)} class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        {#if post.coverImage}
                            <img src={post.coverImage} alt={post.title} class="h-44 w-full object-cover" />
                        {:else}
                            <div class="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-400">No Cover</div>
                        {/if}
                        <div class="space-y-3 p-4">
                            <div class="flex items-center justify-between text-xs text-slate-500">
                                <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString()}</span>
                                <span>{post.viewCount} views</span>
                            </div>
                            <h2 class="line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-slate-700">{post.title}</h2>
                            <p class="line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
                            <div class="flex flex-wrap gap-2">
                                {#each post.tags as tag (tag.id)}
                                    <span class="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">#{tag.name}</span>
                                {/each}
                            </div>
                        </div>
                    </a>
                {/each}
            </section>

            <div class="mt-8 flex items-center justify-center gap-3">
                <button
                    class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
                    disabled={currentPage <= 1}
                    on:click={() => goToPage(currentPage - 1)}
                >
                    Prev
                </button>
                <span class="text-sm text-slate-500">Page {currentPage} / {totalPages}</span>
                <button
                    class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
                    disabled={currentPage >= totalPages}
                    on:click={() => goToPage(currentPage + 1)}
                >
                    Next
                </button>
            </div>
        {/if}
    </main>
</div>
