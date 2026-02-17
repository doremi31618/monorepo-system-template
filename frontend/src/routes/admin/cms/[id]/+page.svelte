<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { getPost, updatePostContent, updatePostStatus, type CmsPost } from '$lib/api/cms';
    import { getDownloadUrl } from '$lib/api/assets';
    import { uploadAsset } from '$lib/services/upload.service';
    import TiptapEditor from '$lib/components/editor/TiptapEditor.svelte';

    const id = $page.params.id ?? '';
    let post: CmsPost | null = null;
    let content: any = {};
    let locale = 'en';
    let loading = true;
    let saving = false;

    async function loadPost() {
        loading = true;
        try {
            const res = await getPost(id, locale);
            if (res.data) {
                post = res.data;
                if (post.content && post.content.body) {
                    content = post.content.body;
                } else {
                    content = {};
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleSave() {
        saving = true;
        try {
            // Update Title & Content (Upsert)
            const res = await updatePostContent(id, locale, {
                title: post?.content?.title || 'Untitled',
                body: content,
                 // seoTitle, seoDesc...
            });
            
            if (res.data) {
               // Notify success
               // loadPost(); // Reload to confirm?
               alert('Saved successfully');
            } else {
                alert('Failed to save');
            }
        } catch(e) {
            console.error(e);
            alert('Error saving post');
        } finally {
            saving = false;
        }
    }
    
    function onEditorChange(e: CustomEvent) {
        content = e.detail.content;
    }

    onMount(() => {
        loadPost();
    });
</script>

<div class="flex h-[calc(100vh-64px)] overflow-hidden">
    <!-- Main Editor Area -->
    <div class="flex-1 flex flex-col min-w-0 bg-white">
        <header class="border-b px-6 py-4 flex justify-between items-center">
             <div class="flex-1 mr-4">
                 <input 
                    type="text" 
                    class="text-2xl font-bold w-full border-none focus:outline-none placeholder-gray-300"
                    placeholder="Post Title"
                    value={post?.content?.title || ''} 
                    on:input={(e) => { 
                        if (!post) return; 
                        if (!post.content) post.content = {}; 
                        post.content.title = e.currentTarget.value; 
                    }}
                 />
             </div>
             <div class="flex items-center space-x-3">
                 <select bind:value={locale} on:change={loadPost} class="border rounded px-2 py-1 text-sm bg-white">
                     <option value="en">English</option>
                     <option value="zh-TW">Traditional Chinese</option>
                 </select>
                 <a href={`/cms/preview/${id}`} target="_blank" class="px-4 py-2 border rounded hover:bg-gray-100 text-sm">
                    Preview
                 </a>
                 <button 
                    class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                    disabled={saving}
                    on:click={handleSave}
                 >
                    {saving ? 'Saving...' : 'Save'}
                 </button>
             </div>
        </header>
        
        <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div class="max-w-4xl bg-white shadow-sm min-h-full rounded-lg p-6">
                {#if !loading && post}
                     <TiptapEditor content={content} on:change={onEditorChange} />
                {:else}
                     <div class="p-10 text-center text-gray-500">Loading...</div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Sidebar -->
    <div class="w-80 border-l bg-gray-50 p-4 hidden lg:block overflow-y-auto">
        <h3 class="font-semibold text-gray-700 mb-4">Settings</h3>
        
        <!-- Status -->
        <div class="mb-6 bg-white p-4 rounded shadow-sm border">
            <label class="block text-sm font-medium text-gray-600 mb-2">Status</label>
            <select 
                class="w-full border rounded px-3 py-2 bg-white" 
                value={post?.status}
                on:change={async (e) => {
                     if (!post) return;
                     const newStatus = e.currentTarget.value;
                     try {
                         const res = await updatePostStatus(post.id, newStatus);
                         if (res.data) {
                             post.status = newStatus as any;
                         }
                     } catch (err) {
                         console.error(err);
                         alert('Failed to update status');
                     }
                }}
            >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
            </select>
        </div>

        <!-- Cover Image -->
        <div class="mb-6 bg-white p-4 rounded shadow-sm border">
            <label class="block text-sm font-medium text-gray-600 mb-2">Cover Image</label>
            {#if post?.content?.coverImage}
                <div class="mb-2 relative group">
                    <img src={post.content.coverImage} alt="Cover" class="w-full h-32 object-cover rounded border" />
                    <button 
                        class="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
                        on:click={() => { if(post && post.content) post.content.coverImage = undefined; }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            {/if}
            <div class="relative">
                 <input 
                    type="file" 
                    accept="image/*"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    on:change={async (e) => {
                        const file = e.currentTarget.files?.[0];
                        if (!file) return;
                        try {
                            const asset = await uploadAsset({ file });
                            const urlRes = await getDownloadUrl(asset.id);
                            const coverImageUrl = urlRes.data?.url ?? (urlRes as { url?: string }).url;

                            if (!coverImageUrl) {
                                throw new Error('Uploaded asset URL not found');
                            }

                            if (!post) return;
                            if (!post.content) post.content = {};
                            post.content.coverImage = coverImageUrl;
                        } catch (err) {
                            console.error(err);
                            alert('Upload failed');
                        }
                    }}
                />
                <button class="w-full border-2 border-dashed border-gray-300 rounded p-2 text-sm text-gray-500 hover:bg-gray-50 text-center">
                    {post?.content?.coverImage ? 'Change Image' : 'Upload Image'}
                </button>
            </div>
        </div>
        
        <!-- SEO -->
        <div class="mb-6 bg-white p-4 rounded shadow-sm border space-y-4">
             <h4 class="font-medium text-gray-700 border-b pb-2">SEO Settings</h4>
             <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">SEO Title</label>
                <input 
                    type="text" 
                    class="w-full border rounded px-3 py-2 text-sm"
                    value={post?.content?.seoTitle || ''}
                    on:input={(e) => {
                        if (post && post.content) {
                            post.content.seoTitle = e.currentTarget.value;
                        }
                    }}
                />
             </div>
             <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">SEO Description</label>
                <textarea 
                    class="w-full border rounded px-3 py-2 text-sm h-24"
                    value={post?.content?.seoDesc || ''}
                    on:input={(e) => {
                        if (post && post.content) {
                            post.content.seoDesc = e.currentTarget.value;
                        }
                    }}
                ></textarea>
             </div>
        </div>

        <!-- Slug -->
         <div class="mb-6 bg-white p-4 rounded shadow-sm border">
            <label class="block text-sm font-medium text-gray-600 mb-1">Slug</label>
            <input type="text" class="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={post?.slug || ''} disabled />
         </div>
    </div>
</div>
