<script lang="ts">
    import { page } from '$app/stores';
    import { resolve } from '$app/paths';
    import { onMount } from 'svelte';
    import TiptapEditor from '$lib/components/editor/TiptapEditor.svelte';
    import { extractTocFromTiptap, type TocItem } from '$lib/features/cms/toc';
    import { getPublicPostBySlug, trackPublicPostView, type PublicCmsPostDetail } from '$lib/api/cms';

    const slug = $page.params.slug ?? '';
    let post: PublicCmsPostDetail | null = null;
    let loading = true;
    let tocItems: TocItem[] = [];

    function scrollToHeading(index: number) {
        const headings = Array.from(
            document.querySelectorAll('.tiptap-editor .ProseMirror h1, .tiptap-editor .ProseMirror h2, .tiptap-editor .ProseMirror h3')
        ) as HTMLElement[];
        const target = headings[index];
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    onMount(async () => {
        try {
            const res = await getPublicPostBySlug(slug, 'en');
            if (!res.data) return;
            post = res.data;
            tocItems = extractTocFromTiptap(post.content?.body ?? {});

            const viewRes = await trackPublicPostView(slug);
            if (viewRes.data && post) {
                post.viewCount = viewRes.data.viewCount;
            }
        } catch (error) {
            console.error(error);
            post = null;
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen bg-[#f9fafb]">
    <header class="border-b bg-white/95 backdrop-blur">
        <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <a href={resolve('/')} class="text-sm font-semibold text-slate-900">Content Hub</a>
            <a href={resolve('/blog')} class="text-sm text-slate-600 hover:text-slate-900">All Posts</a>
        </div>
    </header>

    {#if loading}
        <div class="py-28 text-center text-slate-500">Loading article...</div>
    {:else if !post}
        <div class="py-28 text-center text-slate-400">Post not found.</div>
    {:else}
        <main class="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_260px]">
            <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
                {#if post.content?.coverImage}
                    <img src={post.content.coverImage} alt={post.content?.title || 'Cover'} class="mb-8 h-72 w-full rounded-xl object-cover" />
                {/if}

                <h1 class="mb-4 text-4xl font-black tracking-tight text-slate-900">{post.content?.title || 'Untitled'}</h1>

                <div class="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.viewCount ?? 0} views</span>
                    <span>•</span>
                    <span>{post.locale || 'en'}</span>
                </div>

                <div class="mb-8 flex flex-wrap gap-2">
                    {#each post.tags || [] as tag (tag.id)}
                        <a href={`/blog?tag=${tag.slug}`} class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200">
                            #{tag.name}
                        </a>
                    {/each}
                </div>

                <TiptapEditor content={post.content?.body} editable={false} />
            </article>

            <aside class="hidden lg:block">
                <div class="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p class="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Table of Contents</p>
                    {#if tocItems.length === 0}
                        <p class="text-sm text-slate-400">No headings in this article.</p>
                    {:else}
                        <div class="space-y-1.5">
                            {#each tocItems as item, index (item.id)}
                                <button
                                    class="block w-full rounded px-2 py-1 text-left text-xs text-slate-600 hover:bg-slate-100"
                                    style="padding-left: {item.level === 1 ? '0.5rem' : item.level === 2 ? '1rem' : '1.5rem'}"
                                    on:click={() => scrollToHeading(index)}
                                >
                                    {item.text}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </aside>
        </main>
    {/if}
</div>
