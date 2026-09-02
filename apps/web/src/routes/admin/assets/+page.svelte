<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/stores';
    import { Download, FileText, Image as ImageIcon, Loader2, Pencil, Save, Trash2, X } from 'lucide-svelte';
    import {
        DataViewToolbar,
        parseDataViewQuery,
        writeDataViewQuery,
        type DataViewProperty,
        type DataViewQuery,
    } from '@platform/svelte-ui/data-view-toolbar';
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
    let mimePrefix = 'all';
    let visibility = 'all';
    let dataViewQuery: DataViewQuery = { search: '', filters: [], sorts: [] };
    const assetProperties: DataViewProperty[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'enum',
            operators: ['is'],
            options: [
                { value: 'ready', label: 'Ready' },
                { value: 'pending', label: 'Pending' },
            ],
        },
        {
            key: 'mimePrefix',
            label: 'File type',
            type: 'enum',
            operators: ['is'],
            options: [
                { value: 'image/', label: 'Image' },
                { value: 'video/', label: 'Video' },
                { value: 'audio/', label: 'Audio' },
                { value: 'application/', label: 'Document' },
            ],
        },
        {
            key: 'visibility',
            label: 'Visibility',
            type: 'enum',
            operators: ['is'],
            options: [
                { value: 'public', label: 'Public' },
                { value: 'private', label: 'Private' },
            ],
        },
        { key: 'createdAt', label: 'Created', type: 'date', operators: [], sortable: true },
        { key: 'updatedAt', label: 'Updated', type: 'date', operators: [], sortable: true },
        { key: 'name', label: 'Name', type: 'text', operators: [], sortable: true },
        { key: 'size', label: 'Size', type: 'number', operators: [], sortable: true },
    ];
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
                mimePrefix,
                visibility,
                sort: dataViewQuery.sorts.map((sort) => `${sort.property}:${sort.direction}`),
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

    function applyDataViewQuery(query: DataViewQuery) {
        searchQuery = query.search;
        const valueFor = (property: string) => {
            const value = query.filters.find((filter) => filter.property === property)?.value;
            return Array.isArray(value) ? (value[0] ?? 'all') : (value ?? 'all');
        };
        statusFilter = valueFor('status');
        mimePrefix = valueFor('mimePrefix');
        visibility = valueFor('visibility');
    }

    async function handleDataViewQueryChange(next: DataViewQuery) {
        dataViewQuery = next;
        applyDataViewQuery(next);
        const params = writeDataViewQuery($page.url.searchParams, next);
        await goto(`${resolve('/admin/assets')}?${params.toString()}`, {
            replaceState: true,
            noScroll: true,
            keepFocus: true,
        });
        await loadAssets();
    }

    function displayAssetName(asset: Asset) {
        const preferred = asset.originalName?.trim();
        if (preferred) return preferred;
        const segments = asset.storageKey.split('/');
        return segments[segments.length - 1] || asset.storageKey;
    }

    onMount(() => {
        dataViewQuery = parseDataViewQuery($page.url.searchParams, assetProperties);
        applyDataViewQuery(dataViewQuery);
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
                class="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                disabled={isUploading}
                on:click={() => fileInput.click()}
            >
                {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Asset'}
            </button>
        </div>
    </div>

    <div class="mb-4 border-y py-2">
        <DataViewToolbar
            properties={assetProperties}
            query={dataViewQuery}
            searchLabel="Search assets"
            searchPlaceholder="Search filename or storage key…"
            onquerychange={handleDataViewQueryChange}
        />
    </div>

    {#if loading}
        <div class="text-muted-foreground">Loading assets...</div>
    {:else}
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {#each assets as asset (asset.id)}
                <div class="flex flex-col items-center rounded border bg-card p-2 text-card-foreground transition hover:shadow-lg" data-theme-surface>
                    <div class="mb-2 flex h-32 w-full items-center justify-center overflow-hidden rounded bg-muted">
                        {#if asset.mimeType?.startsWith('image/')}
                            {#if previewUrls[asset.id]}
                                <img
                                    src={previewUrls[asset.id]}
                                    alt={asset.storageKey}
                                    class="h-full w-full object-cover"
                                    on:error={() => handlePreviewImageError(asset)}
                                />
                            {:else if previewLoading[asset.id]}
                                <span class="text-xs text-muted-foreground">Loading...</span>
                            {:else if previewFailed[asset.id]}
                                <button
                                    class="text-xs text-destructive hover:underline"
                                    on:click={() => loadPreviewUrl(asset, true)}
                                >
                                    Retry
                                </button>
                            {:else}
                                <ImageIcon class="size-8 text-muted-foreground" aria-hidden="true" />
                            {/if}
                        {:else}
                             <FileText class="size-8 text-muted-foreground" aria-hidden="true" />
                        {/if}
                    </div>
                    {#if editingAssetId === asset.id}
                        <input
                            class="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground"
                            bind:value={editingOriginalName}
                            placeholder="Asset name"
                        />
                    {:else}
                        <div class="text-sm font-medium truncate w-full text-center" title={displayAssetName(asset)}>{displayAssetName(asset)}</div>
                    {/if}
                    <div class="text-xs text-muted-foreground">{asset.mimeType}</div>
                    {#if editingAssetId === asset.id}
                        <select class="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground" bind:value={editingStatus}>
                            <option value="ready">ready</option>
                            <option value="pending">pending</option>
                        </select>
                    {:else}
                        <div class="text-xs text-muted-foreground">status: {asset.status}</div>
                    {/if}
                    <div class="text-xs text-muted-foreground">{((asset.size ?? 0) / 1024).toFixed(1)} KB</div>
                    <div class="mt-2 flex items-center gap-3">
                        <button 
                            class="inline-flex h-8 w-8 items-center justify-center rounded text-primary transition-colors hover:bg-accent"
                            on:click={() => getSignedUrl(asset.id)}
                            aria-label="Download asset"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                        {#if editingAssetId === asset.id}
                            <button
                                class="inline-flex h-8 w-8 items-center justify-center rounded text-primary transition-colors hover:bg-accent disabled:opacity-50"
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
                                class="inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                on:click={cancelEditAsset}
                                aria-label="Cancel editing asset"
                                title="Cancel"
                            >
                                <X size={16} />
                            </button>
                        {:else}
                            <button
                                class="inline-flex h-8 w-8 items-center justify-center rounded text-primary transition-colors hover:bg-accent"
                                on:click={() => startEditAsset(asset)}
                                aria-label="Edit asset"
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </button>
                        {/if}
                        <button
                            class="inline-flex h-8 w-8 items-center justify-center rounded text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                            disabled={deletingAssetId === asset.id || editingAssetId === asset.id}
                            on:click={() => handleDeleteAsset(asset)}
                            aria-label="Delete asset"
                            title="Delete"
                        >
                            {#if deletingAssetId === asset.id}
                                <Loader2 size={16} class="animate-spin" />
                            {:else}
                                <Trash2 size={16} />
                            {/if}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
        {#if assets.length === 0}
            <div class="py-10 text-center text-muted-foreground">No assets found. Upload one!</div>
        {/if}
    {/if}
</div>
