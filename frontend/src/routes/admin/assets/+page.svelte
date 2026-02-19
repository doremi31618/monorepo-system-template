<script lang="ts">
    import { onMount } from 'svelte';
    import { Download, Loader2, Pencil, Save, Search, Trash2, X } from 'lucide-svelte';
    import { deleteAsset as deleteAssetApi, getAssetPublicUrl, getDownloadUrl, listAssets, updateAsset, type Asset } from '$lib/api/assets';
    import { uploadAsset } from '$lib/services/upload.service';

    let assets: Asset[] = [];
    let loading = true;
    let isUploading = false;
    let uploadProgress = 0;
    let fileInput: HTMLInputElement;
    let deletingAssetId: string | null = null;
    let previewUrls: Record<string, string> = {};
    let previewLoading: Record<string, boolean> = {};
    let previewFailed: Record<string, boolean> = {};
    let previewRefreshCount: Record<string, number> = {};
    let searchQuery = '';
    let statusFilter = 'all';
    let editingAssetId: string | null = null;
    let editingOriginalName = '';
    let editingStatus: 'pending' | 'ready' = 'ready';
    let savingAssetId: string | null = null;

    const isImageAsset = (asset: Asset) => asset.mimeType?.startsWith('image/');

    function extractUrl(payload: unknown): string | undefined {
        if (!payload || typeof payload !== 'object') return undefined;
        const direct = (payload as { url?: string }).url;
        if (typeof direct === 'string') return direct;
        return undefined;
    }

    function prunePreviewState(nextAssets: Asset[]) {
        const ids = new Set(nextAssets.map((asset) => asset.id));
        previewUrls = Object.fromEntries(Object.entries(previewUrls).filter(([id]) => ids.has(id)));
        previewLoading = Object.fromEntries(Object.entries(previewLoading).filter(([id]) => ids.has(id)));
        previewFailed = Object.fromEntries(Object.entries(previewFailed).filter(([id]) => ids.has(id)));
        previewRefreshCount = Object.fromEntries(Object.entries(previewRefreshCount).filter(([id]) => ids.has(id)));
    }

    async function loadPreviewUrl(asset: Asset, force = false) {
        if (!isImageAsset(asset)) return;
        if (!force && previewUrls[asset.id]) return;

        previewLoading = { ...previewLoading, [asset.id]: true };
        previewFailed = { ...previewFailed, [asset.id]: false };

        try {
            previewUrls = { ...previewUrls, [asset.id]: getAssetPublicUrl(asset.id) };
        } catch (e) {
            console.error(`Failed to load preview URL for asset ${asset.id}`, e);
            previewFailed = { ...previewFailed, [asset.id]: true };
        } finally {
            previewLoading = { ...previewLoading, [asset.id]: false };
        }
    }

    async function loadPreviewUrls(nextAssets: Asset[]) {
        const imageAssets = nextAssets.filter(isImageAsset);
        await Promise.allSettled(imageAssets.map((asset) => loadPreviewUrl(asset)));
    }

    async function loadAssets() {
        loading = true;
        try {
            const res = await listAssets({
                page: 1,
                limit: 50,
                query: searchQuery,
                status: statusFilter,
            });
            assets = res.data?.data ?? [];
            prunePreviewState(assets);
            void loadPreviewUrls(assets);
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            await handleUpload(file);
        }
        // Reset input
        target.value = '';
    }

    async function handleUpload(file: File) {
        isUploading = true;
        uploadProgress = 0;
        try {
            await uploadAsset({
                file,
                onProgress: (p) => uploadProgress = p
            });
            await loadAssets(); // Refresh list
        } catch (e) {
            console.error(e);
            alert('Upload failed: ' + String(e));
        } finally {
            isUploading = false;
        }
    }

    async function handleDeleteAsset(asset: Asset) {
        const confirmed = window.confirm(`Delete asset "${displayAssetName(asset)}"? This action cannot be undone.`);
        if (!confirmed) return;

        deletingAssetId = asset.id;
        try {
            await deleteAssetApi(asset.id);
            assets = assets.filter((current) => current.id !== asset.id);
            prunePreviewState(assets);
        } catch (e) {
            console.error(e);
            alert('Failed to delete asset');
        } finally {
            deletingAssetId = null;
        }
    }

    function startEditAsset(asset: Asset) {
        editingAssetId = asset.id;
        editingOriginalName = displayAssetName(asset);
        editingStatus = asset.status === 'pending' ? 'pending' : 'ready';
    }

    function cancelEditAsset() {
        editingAssetId = null;
        editingOriginalName = '';
        editingStatus = 'ready';
    }

    async function handleSaveAsset(asset: Asset) {
        const nextName = editingOriginalName.trim();
        if (!nextName) {
            alert('Asset name is required');
            return;
        }

        savingAssetId = asset.id;
        try {
            const res = await updateAsset(asset.id, {
                originalName: nextName,
                status: editingStatus,
            });
            const updated = res.data;
            if (!updated) return;

            assets = assets.map((current) => (current.id === asset.id ? { ...current, ...updated } : current));

            if (updated.status !== 'ready') {
                const nextPreviewUrls = { ...previewUrls };
                delete nextPreviewUrls[asset.id];
                previewUrls = nextPreviewUrls;
            }

            cancelEditAsset();
        } catch (error) {
            console.error(error);
            alert('Failed to update asset');
        } finally {
            savingAssetId = null;
        }
    }

    async function getSignedUrl(id: string) {
        const res = await getDownloadUrl(id);
        const url = res.data?.url ?? extractUrl(res);
        if (!url) {
            throw new Error('Unable to resolve asset URL');
        }
        window.open(url, '_blank');
    }

    async function handlePreviewImageError(asset: Asset) {
        const retryCount = previewRefreshCount[asset.id] ?? 0;
        if (retryCount >= 1) {
            previewFailed = { ...previewFailed, [asset.id]: true };
            return;
        }

        previewRefreshCount = { ...previewRefreshCount, [asset.id]: retryCount + 1 };
        await loadPreviewUrl(asset, true);
    }

    async function handleSearchSubmit() {
        await loadAssets();
    }

    async function handleResetFilters() {
        searchQuery = '';
        statusFilter = 'all';
        await loadAssets();
    }

    function displayAssetName(asset: Asset) {
        const preferred = asset.originalName?.trim();
        if (preferred) return preferred;
        const segments = asset.storageKey.split('/');
        return segments[segments.length - 1] || asset.storageKey;
    }

    onMount(() => {
        loadAssets();
    });
</script>

<div class="p-6">
    <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Media Library</h1>
        <div>
            <input 
                type="file" 
                class="hidden" 
                bind:this={fileInput} 
                on:change={handleFileSelect}
            />
            <button 
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isUploading}
                on:click={() => fileInput.click()}
            >
                {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Asset'}
            </button>
        </div>
    </div>

    <div class="mb-4 rounded border bg-white p-3 shadow-sm">
        <div class="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_160px_auto_auto]">
            <div class="relative">
                <Search size={16} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    class="w-full rounded border px-3 py-2 pl-9 text-sm"
                    placeholder="Search by asset name"
                    bind:value={searchQuery}
                    on:keydown={(event) => event.key === 'Enter' && handleSearchSubmit()}
                />
            </div>
            <select class="rounded border px-3 py-2 text-sm" bind:value={statusFilter}>
                <option value="all">All status</option>
                <option value="ready">Ready</option>
                <option value="pending">Pending</option>
            </select>
            <button class="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700" on:click={handleSearchSubmit}>
                Search
            </button>
            <button class="inline-flex items-center justify-center rounded border px-3 py-2 text-sm hover:bg-gray-50" on:click={handleResetFilters}>
                <X size={14} />
            </button>
        </div>
    </div>

    {#if loading}
        <div class="text-gray-500">Loading assets...</div>
    {:else}
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {#each assets as asset (asset.id)}
                <div class="border rounded p-2 hover:shadow-lg transition flex flex-col items-center">
                    <div class="h-32 w-full bg-gray-100 mb-2 flex items-center justify-center overflow-hidden rounded">
                        {#if asset.mimeType?.startsWith('image/')}
                            {#if previewUrls[asset.id]}
                                <img
                                    src={previewUrls[asset.id]}
                                    alt={asset.storageKey}
                                    class="h-full w-full object-cover"
                                    on:error={() => handlePreviewImageError(asset)}
                                />
                            {:else if previewLoading[asset.id]}
                                <span class="text-xs text-gray-400">Loading...</span>
                            {:else if previewFailed[asset.id]}
                                <button
                                    class="text-xs text-red-500 hover:underline"
                                    on:click={() => loadPreviewUrl(asset, true)}
                                >
                                    Retry
                                </button>
                            {:else}
                                <span class="text-2xl">🖼️</span>
                            {/if}
                        {:else}
                             <span class="text-2xl">📄</span>
                        {/if}
                    </div>
                    {#if editingAssetId === asset.id}
                        <input
                            class="w-full rounded border px-2 py-1 text-sm"
                            bind:value={editingOriginalName}
                            placeholder="Asset name"
                        />
                    {:else}
                        <div class="text-sm font-medium truncate w-full text-center" title={displayAssetName(asset)}>{displayAssetName(asset)}</div>
                    {/if}
                    <div class="text-xs text-gray-500">{asset.mimeType}</div>
                    {#if editingAssetId === asset.id}
                        <select class="mt-1 w-full rounded border px-2 py-1 text-xs" bind:value={editingStatus}>
                            <option value="ready">ready</option>
                            <option value="pending">pending</option>
                        </select>
                    {:else}
                        <div class="text-xs text-gray-500">status: {asset.status}</div>
                    {/if}
                    <div class="text-xs text-gray-400">{(asset.size / 1024).toFixed(1)} KB</div>
                    <div class="mt-2 flex items-center gap-3">
                        <button 
                            class="inline-flex h-8 w-8 items-center justify-center rounded text-blue-600 transition-colors hover:bg-blue-50"
                            on:click={() => getSignedUrl(asset.id)}
                            aria-label="Download asset"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                        {#if editingAssetId === asset.id}
                            <button
                                class="inline-flex h-8 w-8 items-center justify-center rounded text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                                on:click={() => handleSaveAsset(asset)}
                                disabled={savingAssetId === asset.id}
                                aria-label="Save asset"
                                title="Save"
                            >
                                {#if savingAssetId === asset.id}
                                    <Loader2 size={16} class="animate-spin" />
                                {:else}
                                    <Save size={16} />
                                {/if}
                            </button>
                            <button
                                class="inline-flex h-8 w-8 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100"
                                on:click={cancelEditAsset}
                                aria-label="Cancel editing asset"
                                title="Cancel"
                            >
                                <X size={16} />
                            </button>
                        {:else}
                            <button
                                class="inline-flex h-8 w-8 items-center justify-center rounded text-blue-600 transition-colors hover:bg-blue-50"
                                on:click={() => startEditAsset(asset)}
                                aria-label="Edit asset"
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </button>
                        {/if}
                        <button
                            class="inline-flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-red-50 disabled:opacity-50"
                            disabled={deletingAssetId === asset.id || editingAssetId === asset.id}
                            on:click={() => handleDeleteAsset(asset)}
                            aria-label="Delete asset"
                            title="Delete"
                        >
                            {#if deletingAssetId === asset.id}
                                <Loader2 size={16} class="animate-spin text-red-600" />
                            {:else}
                                <Trash2 size={16} class="text-red-600" />
                            {/if}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
        {#if assets.length === 0}
            <div class="text-gray-400 text-center py-10">No assets found. Upload one!</div>
        {/if}
    {/if}
</div>
