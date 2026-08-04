<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Image as ImageIcon, Loader2, Search, Upload, X } from 'lucide-svelte';
    import { getAssetPublicUrl, listAssets, type Asset } from '$lib/api/assets';
    import { uploadAsset } from '$lib/services/upload.service';

    export let open = false;
    export let title = 'Select Image';
    export let mimePrefix = 'image/';
    export let selectedAssetId: string | null = null;

    const dispatch = createEventDispatcher<{
        select: { asset: Asset; url: string };
        cancel: void;
    }>();

    let assets: Asset[] = [];
    let loading = false;
    let uploading = false;
    let uploadProgress = 0;
    let query = '';
    let status = 'ready';
    let previewUrls: Record<string, string> = {};
    let previewLoading: Record<string, boolean> = {};
    let previewFailed: Record<string, boolean> = {};
    let uploadInput: HTMLInputElement;
    let hasLoadedForCurrentOpen = false;

    $: if (open && !hasLoadedForCurrentOpen) {
        hasLoadedForCurrentOpen = true;
        void loadAssets();
    }

    $: if (!open) {
        hasLoadedForCurrentOpen = false;
    }

    async function loadPreviewUrl(asset: Asset, force = false) {
        if (!force && previewUrls[asset.id]) return;

        previewLoading = { ...previewLoading, [asset.id]: true };
        previewFailed = { ...previewFailed, [asset.id]: false };

        try {
            previewUrls = { ...previewUrls, [asset.id]: getAssetPublicUrl(asset.id) };
        } catch (error) {
            console.error('Failed to load asset preview', error);
            previewFailed = { ...previewFailed, [asset.id]: true };
        } finally {
            previewLoading = { ...previewLoading, [asset.id]: false };
        }
    }

    async function loadAssets() {
        loading = true;
        try {
            const res = await listAssets({
                page: 1,
                limit: 60,
                query,
                status,
                mimePrefix,
            });

            assets = res.data?.data ?? [];

            const currentIds = new Set(assets.map((asset) => asset.id));
            previewUrls = Object.fromEntries(Object.entries(previewUrls).filter(([id]) => currentIds.has(id)));
            previewLoading = Object.fromEntries(Object.entries(previewLoading).filter(([id]) => currentIds.has(id)));
            previewFailed = Object.fromEntries(Object.entries(previewFailed).filter(([id]) => currentIds.has(id)));

            await Promise.allSettled(assets.map((asset) => loadPreviewUrl(asset)));
        } catch (error) {
            console.error(error);
            assets = [];
        } finally {
            loading = false;
        }
    }

    async function selectExistingAsset(asset: Asset) {
        try {
            const url = getAssetPublicUrl(asset.id);
            dispatch('select', { asset, url });
            open = false;
        } catch (error) {
            console.error(error);
            alert('Unable to select this asset.');
        }
    }

    async function handleUpload(file: File) {
        uploading = true;
        uploadProgress = 0;

        try {
            const uploaded = await uploadAsset({
                file,
                onProgress: (progress) => {
                    uploadProgress = progress;
                },
            });

            const url = getAssetPublicUrl(uploaded.id);

            const uploadedAsset: Asset = {
                id: uploaded.id,
                storageKey: uploaded.storageKey,
                originalName: file.name,
                status: uploaded.status,
                mimeType: uploaded.mimeType,
                size: uploaded.size,
                visibility: uploaded.visibility,
                createdAt: uploaded.createdAt,
                updatedAt: uploaded.updatedAt,
            };

            dispatch('select', { asset: uploadedAsset, url });
            open = false;
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        } finally {
            uploading = false;
            uploadProgress = 0;
        }
    }

    async function handleUploadChange(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        await handleUpload(file);
        target.value = '';
    }

    function closeModal() {
        open = false;
        dispatch('cancel');
    }

    function displayAssetName(asset: Asset) {
        const preferred = asset.originalName?.trim();
        if (preferred) return preferred;
        const segments = asset.storageKey.split('/');
        return segments[segments.length - 1] || asset.storageKey;
    }
</script>

{#if open}
    <div class="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <button
            class="absolute inset-0 bg-slate-900/45"
            on:click={closeModal}
            aria-label="Close asset picker"
        ></button>

        <div class="relative z-[81] w-full max-w-6xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b px-5 py-4">
                <h3 class="text-lg font-semibold text-slate-900">{title}</h3>
                <button
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    on:click={closeModal}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>

            <div class="flex flex-wrap items-center gap-2 border-b px-5 py-3">
                <form class="flex flex-1 min-w-[220px] items-center gap-2" on:submit|preventDefault={loadAssets}>
                    <div class="relative flex-1">
                        <Search size={15} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            class="w-full rounded border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Search image name"
                            bind:value={query}
                        />
                    </div>
                    <select
                        class="rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        bind:value={status}
                    >
                        <option value="ready">Ready</option>
                        <option value="pending">Pending</option>
                        <option value="all">All</option>
                    </select>
                    <button
                        type="submit"
                        class="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
                    >
                        <Search size={14} />
                        Search
                    </button>
                </form>

                <input
                    type="file"
                    accept={`${mimePrefix}*`}
                    class="hidden"
                    bind:this={uploadInput}
                    on:change={handleUploadChange}
                />
                <button
                    class="inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                    on:click={() => uploadInput.click()}
                    disabled={uploading}
                >
                    {#if uploading}
                        <Loader2 size={14} class="animate-spin" />
                        Uploading {uploadProgress}%
                    {:else}
                        <Upload size={14} />
                        Upload New
                    {/if}
                </button>
            </div>

            <div class="max-h-[65vh] overflow-y-auto p-5">
                {#if loading}
                    <div class="flex items-center justify-center py-16 text-sm text-slate-500">
                        <Loader2 size={16} class="mr-2 animate-spin" />
                        Loading assets...
                    </div>
                {:else if assets.length === 0}
                    <div class="py-16 text-center text-sm text-slate-400">No image assets found.</div>
                {:else}
                    <div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                        {#each assets as asset (asset.id)}
                            <button
                                class={`group rounded-xl border p-2 text-left transition ${
                                    selectedAssetId === asset.id
                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                        : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                                on:click={() => selectExistingAsset(asset)}
                            >
                                <div class="relative mb-2 flex h-24 items-center justify-center overflow-hidden rounded bg-slate-100">
                                    {#if previewUrls[asset.id]}
                                        <img
                                            src={previewUrls[asset.id]}
                                            alt={displayAssetName(asset)}
                                            class="h-full w-full object-cover"
                                            on:error={() => loadPreviewUrl(asset, true)}
                                        />
                                    {:else if previewLoading[asset.id]}
                                        <Loader2 size={14} class="animate-spin text-slate-400" />
                                    {:else if previewFailed[asset.id]}
                                        <span class="text-xs text-red-500">Preview failed</span>
                                    {:else}
                                        <ImageIcon size={18} class="text-slate-400" />
                                    {/if}
                                </div>
                                <p class="truncate text-xs font-medium text-slate-700" title={displayAssetName(asset)}>
                                    {displayAssetName(asset)}
                                </p>
                                <p class="text-xs text-slate-400">{(asset.size / 1024).toFixed(1)} KB</p>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
