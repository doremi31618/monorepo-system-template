<script lang="ts">
    import { resolve } from '$app/paths';
    import { onMount } from 'svelte';
    import { AppConfig } from '$lib/config';
    import { getPublicHome, type PublicCmsPostSummary, type PublicHomeResponse } from '$lib/api/cms';

    let loading = true;
    let latestPosts: PublicCmsPostSummary[] = [];
    let hotTags: PublicHomeResponse['hotTags'] = [];

    onMount(async () => {
        try {
            const res = await getPublicHome({
                latestLimit: 6,
                hotTagLimit: 4,
                hotPostPerTag: 3,
            });
            latestPosts = res.data?.latestPosts ?? [];
            hotTags = res.data?.hotTags ?? [];
        } catch (error) {
            console.error(error);
            latestPosts = [];
            hotTags = [];
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen bg-[#f5f7fb] text-slate-900">
    <header class="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <a href={resolve(AppConfig.route.base)} class="text-xl font-black tracking-tight">Content Hub</a>
            <nav class="flex items-center gap-5 text-sm text-slate-600">
                <a href={resolve('/blog')} class="hover:text-slate-900">Blog</a>
                <a href={resolve(AppConfig.route.admin.cms)} class="hover:text-slate-900">CMS</a>
                <a href={resolve(AppConfig.route.auth.login)} class="hover:text-slate-900">Login</a>
            </nav>
        </div>
    </header>

    <main class="mx-auto w-full max-w-6xl px-6 py-10">
        <section class="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="bg-gradient-to-r from-[#dbeafe] via-[#f1f5f9] to-[#fde68a] px-8 py-10">
                <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publishing Platform</p>
                <h1 class="text-4xl font-black tracking-tight text-slate-900">Latest stories and hottest topics</h1>
                <p class="mt-3 max-w-2xl text-sm text-slate-600">
                    Browse newly published posts and discover the tags collecting the highest total views.
                </p>
            </div>
        </section>

        {#if loading}
            <div class="py-24 text-center text-slate-500">Loading homepage data...</div>
        {:else}
            <section class="mb-10">
                <div class="mb-4 flex items-end justify-between">
                    <h2 class="text-2xl font-bold">Latest Posts</h2>
                    <a href={resolve('/blog')} class="text-sm text-slate-600 hover:text-slate-900">View all</a>
                </div>

                {#if latestPosts.length === 0}
                    <div class="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-400">
                        No published posts yet.
                    </div>
                {:else}
                    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {#each latestPosts as post (post.id)}
                            <a href={resolve(`/blog/${post.slug}`)} class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                {#if post.coverImage}
                                    <img src={post.coverImage} alt={post.title} class="h-40 w-full object-cover" />
                                {:else}
                                    <div class="flex h-40 items-center justify-center bg-slate-100 text-xs text-slate-400">No Cover</div>
                                {/if}
                                <div class="space-y-2 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-500">
                                        <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString()}</span>
                                        <span>{post.viewCount} views</span>
                                    </div>
                                    <h3 class="line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-slate-700">{post.title}</h3>
                                    <p class="line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
                                </div>
                            </a>
                        {/each}
                    </div>
                {/if}
            </section>

            <section>
                <div class="mb-4 flex items-end justify-between">
                    <h2 class="text-2xl font-bold">Hot Tags</h2>
                    <span class="text-sm text-slate-500">Ranked by total tag views</span>
                </div>

                {#if hotTags.length === 0}
                    <div class="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-400">
                        No hot tags yet.
                    </div>
                {:else}
                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {#each hotTags as tag (tag.id)}
                            <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div class="mb-3 flex items-center justify-between">
                                    <a href={`/blog?tag=${tag.slug}`} class="text-lg font-bold text-slate-900 hover:text-slate-700">
                                        #{tag.name}
                                    </a>
                                    <span class="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-white">{tag.totalViews} views</span>
                                </div>
                                <div class="space-y-2">
                                    {#each tag.posts as post (post.id)}
                                        <a href={resolve(`/blog/${post.slug}`)} class="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                                            <p class="line-clamp-1 text-sm font-medium text-slate-800">{post.title}</p>
                                            <p class="mt-1 text-xs text-slate-500">{post.viewCount} views</p>
                                        </a>
                                    {/each}
                                </div>
                            </article>
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}
    </main>
</div>
