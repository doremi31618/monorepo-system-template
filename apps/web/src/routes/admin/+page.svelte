<script lang="ts">
    import { onMount } from 'svelte';
    import { BarChart3, Loader2, RefreshCw } from 'lucide-svelte';
    import { getCmsDashboardAnalytics, type CmsDashboardAnalyticsResponse } from '$lib/api/cms';

    let analytics: CmsDashboardAnalyticsResponse | null = null;
    let loading = true;
    let locale = 'en';
    let days = 14;

    const dayOptions = [7, 14, 30];

    const loadAnalytics = async () => {
        loading = true;
        try {
            const res = await getCmsDashboardAnalytics({
                locale,
                days,
                topLimit: 5,
            });
            analytics = res.data ?? null;
        } catch (error) {
            console.error(error);
            analytics = null;
        } finally {
            loading = false;
        }
    };

    const formatDateLabel = (date: string) => {
        const value = new Date(`${date}T00:00:00Z`);
        return `${value.getUTCMonth() + 1}/${value.getUTCDate()}`;
    };

    $: maxDailyViews = Math.max(...(analytics?.dailyViews.map((item) => item.views) ?? [0]));
    $: totalWindowViews = (analytics?.dailyViews ?? []).reduce((sum, item) => sum + item.views, 0);

    function barHeight(views: number) {
        if (maxDailyViews <= 0) return '0%';
        if (views <= 0) return '0%';
        return `${Math.max((views / maxDailyViews) * 100, 8)}%`;
    }

    onMount(() => {
        void loadAnalytics();
    });
</script>

<div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
            <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
            <p class="text-sm text-muted-foreground">Daily views, top posts, and top tags.</p>
        </div>
        <div class="flex items-center gap-2">
            <select
                class="rounded border bg-white px-3 py-2 text-sm"
                bind:value={locale}
                on:change={loadAnalytics}
            >
                <option value="en">English</option>
                <option value="zh-TW">Traditional Chinese</option>
            </select>
            <select
                class="rounded border bg-white px-3 py-2 text-sm"
                value={days}
                on:change={(event) => {
                    days = Number((event.currentTarget as HTMLSelectElement).value);
                    loadAnalytics();
                }}
            >
                {#each dayOptions as option (option)}
                    <option value={option}>{option} days</option>
                {/each}
            </select>
            <button
                class="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm hover:bg-gray-50"
                on:click={loadAnalytics}
            >
                <RefreshCw size={14} />
                Refresh
            </button>
        </div>
    </div>

    {#if loading}
        <div class="flex items-center justify-center rounded-xl border bg-white py-16 text-sm text-gray-500">
            <Loader2 size={16} class="mr-2 animate-spin" />
            Loading dashboard...
        </div>
    {:else if !analytics}
        <div class="rounded-xl border border-dashed bg-white py-16 text-center text-sm text-gray-400">
            Unable to load analytics.
        </div>
    {:else}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article class="rounded-xl border bg-white p-4 shadow-sm">
                <p class="text-xs uppercase tracking-wide text-gray-500">Window Views</p>
                <p class="mt-2 text-2xl font-bold text-gray-900">{totalWindowViews}</p>
                <p class="mt-1 text-xs text-gray-500">Last {days} days</p>
            </article>
            <article class="rounded-xl border bg-white p-4 shadow-sm">
                <p class="text-xs uppercase tracking-wide text-gray-500">Top Post Views</p>
                <p class="mt-2 text-2xl font-bold text-gray-900">{analytics.topPosts[0]?.viewCount ?? 0}</p>
                <p class="mt-1 truncate text-xs text-gray-500">{analytics.topPosts[0]?.title || 'No data'}</p>
            </article>
            <article class="rounded-xl border bg-white p-4 shadow-sm">
                <p class="text-xs uppercase tracking-wide text-gray-500">Top Tag Views</p>
                <p class="mt-2 text-2xl font-bold text-gray-900">{analytics.topTags[0]?.totalViews ?? 0}</p>
                <p class="mt-1 truncate text-xs text-gray-500">#{analytics.topTags[0]?.name || 'No data'}</p>
            </article>
        </div>

        <section class="rounded-xl border bg-white p-4 shadow-sm">
            <div class="mb-3 flex items-center gap-2">
                <BarChart3 size={16} class="text-blue-600" />
                <h2 class="text-base font-semibold text-gray-900">Daily Clicks</h2>
            </div>
            {#if analytics.dailyViews.length === 0}
                <div class="py-8 text-center text-sm text-gray-400">No view data yet.</div>
            {:else}
                <div class="overflow-x-auto">
                    <div class="flex min-w-[420px] items-end gap-2 pb-2">
                        {#each analytics.dailyViews as item (item.date)}
                            <div class="flex flex-1 flex-col items-center justify-end gap-1">
                                <div class="flex h-36 w-full items-end rounded bg-slate-50 px-1">
                                    <div
                                        class="w-full rounded-t bg-blue-500 transition-all"
                                        style={`height: ${barHeight(item.views)};`}
                                        title={`${item.date}: ${item.views}`}
                                    ></div>
                                </div>
                                <p class="text-[10px] text-slate-500">{formatDateLabel(item.date)}</p>
                                <p class="text-[10px] font-medium text-slate-700">{item.views}</p>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </section>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section class="rounded-xl border bg-white p-4 shadow-sm">
                <h2 class="mb-3 text-base font-semibold text-gray-900">Top 5 Posts</h2>
                {#if analytics.topPosts.length === 0}
                    <div class="py-8 text-center text-sm text-gray-400">No post stats.</div>
                {:else}
                    <div class="space-y-2">
                        {#each analytics.topPosts as post, index (post.id)}
                            <div class="flex items-center justify-between rounded border px-3 py-2">
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-medium text-gray-800">{index + 1}. {post.title}</p>
                                    <p class="text-xs text-gray-500">/{post.slug}</p>
                                </div>
                                <span class="shrink-0 rounded bg-slate-900 px-2 py-1 text-xs text-white">{post.viewCount}</span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>

            <section class="rounded-xl border bg-white p-4 shadow-sm">
                <h2 class="mb-3 text-base font-semibold text-gray-900">Top 5 Tags</h2>
                {#if analytics.topTags.length === 0}
                    <div class="py-8 text-center text-sm text-gray-400">No tag stats.</div>
                {:else}
                    <div class="space-y-2">
                        {#each analytics.topTags as tag, index (tag.id)}
                            <div class="flex items-center justify-between rounded border px-3 py-2">
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-medium text-gray-800">{index + 1}. #{tag.name}</p>
                                    <p class="text-xs text-gray-500">{tag.postCount} posts</p>
                                </div>
                                <span class="shrink-0 rounded bg-slate-900 px-2 py-1 text-xs text-white">{tag.totalViews}</span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>
        </div>
    {/if}
</div>
