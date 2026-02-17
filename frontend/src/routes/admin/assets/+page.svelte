<script lang="ts">
    import { onMount } from 'svelte';
    import { getDownloadUrl, listAssets, type Asset } from '$lib/api/assets';
    import { uploadAsset } from '$lib/services/upload.service';

    let assets: Asset[] = [];
    let loading = true;
    let isUploading = false;
    let uploadProgress = 0;
    let fileInput: HTMLInputElement;
    let previewUrls: Record<string, string> = {};
    let previewLoading: Record<string, boolean> = {};
    let previewFailed: Record<string, boolean> = {};
    let previewRefreshCount: Record<string, number> = {};

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
            const res = await getDownloadUrl(asset.id);
            const url = res.data?.url ?? extractUrl(res);
            if (!url) {
                throw new Error(`Asset ${asset.id} url is missing`);
            }
            previewUrls = { ...previewUrls, [asset.id]: url };
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
            const res = await listAssets(1, 50);
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

    onMount(() => {
        loadAssets();
    });
</script>

<div class="p-6">
    <div class="flex justify-between items-center mb-6">
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
                    <div class="text-sm font-medium truncate w-full text-center" title={asset.storageKey}>{asset.mimeType}</div>
                    <div class="text-xs text-gray-400">{(asset.size / 1024).toFixed(1)} KB</div>
                    <button 
                        class="text-xs text-blue-500 mt-2 hover:underline"
                        on:click={() => getSignedUrl(asset.id)}
                    >
                        Download
                    </button>
                </div>
            {/each}
        </div>
        {#if assets.length === 0}
            <div class="text-gray-400 text-center py-10">No assets found. Upload one!</div>
        {/if}
    {/if}
</div>
