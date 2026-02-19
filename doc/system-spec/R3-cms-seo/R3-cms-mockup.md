這是一份根據你的初版規格，並整合了 **Notion 式拖曳體驗 (Block-based Editing)** 與 **多語系 SEO 策略** 的完整產品規格書 (Product Spec)。

這份文件將作為開發團隊（前端、後端、設計）的單一事實來源 (Single Source of Truth)。

---

# R3 CMS & Content Platform - 產品規格書 (v2.0)

## 1. 產品願景

打造一個具備 **Notion 般流暢編輯體驗** 的企業級內容管理系統，支援多語系、高效能 SEO 以及直覺的資源管理 (R3c)。

---

## 2. 使用者角色與故事 (User Stories)

### 2.1 內容編輯者 (Internal Editor)

* **區塊化創作**：我想要像 Notion 一樣，透過拖拽 `⠿` 抓手來重新排列段落、標題與圖片。
* **多語系對照**：我想要在同一個介面切換語系，並快速填寫對應的翻譯內容。
* **自動儲存**：編輯過程中系統需自動存為 `Draft`，防止因瀏覽器崩潰遺失數據。
* **資源直拖**：我能直接從桌面拖曳圖片到編輯器，自動觸發上傳並插入。

### 2.2 讀者 (Public Reader)

* **極速載入**：頁面需透過 SSR 達成秒開。
* **在地化 URL**：能根據語系看到對應的 URL（例如 `/zh-tw/blog/post-1`）。

---

## 3. 功能需求 (Functional Requirements)

### 3.1 核心編輯器 (Block-based Editor)

* **Notion 式互動**：
* 每個節點（段落、H1-H3、圖片、列表）皆為一個可獨立拖拽的 **Block**。
* Hover 顯示 `⠿` (Drag Handle) 與 `+` (Quick Insert)。


* **多媒體處理**：
* 支援拖入圖片、貼上圖片連結。
* 圖片區塊支援 `Alt Text` 編輯（SEO 必要）。


* **自動存檔 (Auto-save)**：每 30 秒或停止輸入 2 秒後觸發 `PATCH /posts/:id`。

### 3.2 多語系管理 (Internationalization)

* **Locale 狀態**：每個語系內容獨立存儲於 `post_contents`。
* **切換機制**：Admin UI 提供切換器，切換後 Editor Canvas 載入該 Locale 的 `title` 與 `body`。
* **發佈邏輯**：可設定「全語系發佈」或「僅發佈特定語系」。

### 3.3 SEO 與 社交分享

* **自定義 Slug**：全站唯一，作為 URL 關鍵字。
* **Meta 預覽**：在後台即時顯示 Google 搜尋結果與 FB/Twitter 分享卡片的預覽樣式。

---

## 4. UI/UX 規範 (Interface Design)

### 4.1 編輯器配置 (Layout)

| 區域 | 說明 |
| --- | --- |
| **Top Bar** | 顯示儲存狀態（Saved/Saving）、語系切換、Preview 按鈕、Publish 按鈕。 |
| **Main (Center)** | 寬度 800px 居中。頂部為 H1 Title，下方為 Tiptap Block Area。 |
| **Right Sidebar** | **[SEO 標籤頁]**：Slug, Meta Title/Desc, OG Image。<br>

<br>**[設定標籤頁]**：作者、發佈日期、分類標籤。 |

### 4.2 互動細節 (Interactions)

* **Drag & Drop**：拖動時，目標位置顯示水平藍線 (Indicator)。
* **Slash Command**：輸入 `/` 彈出快速插入選單（Heading, Image, List）。

---

## 5. 系統架構與 API (Technical Spec)

### 5.1 資料庫 Schema 調整

在 `post_contents` 中，`body` 欄位應存儲符合 Tiptap/ProseMirror 規範的 JSON。

### 5.2 核心 API

* `POST /v1/cms/assets/upload`：處理圖片拖入後的異步上傳。
* `GET /v1/public/cms/posts/:slug?locale=...`：
* 需包含 `next_post` 與 `prev_post` 的基本資訊以利 SEO 鏈接。
* 回傳包含全套 Meta Tags 的 JSON 或預渲染 HTML。



---

## 6. 驗收標準 (Acceptance Criteria)

* [ ] **拖拽性能**：拖拽 Block 時 FPS 穩定在 60，無明顯延遲。
* [ ] **SEO 分數**：Lighthouse SEO 項目達 95+ 分。
* [ ] **安全性**：只有具備 `cms.post.update` 權限的人員可觸發自動儲存。
* [ ] **兼容性**：產出的內容在行動端瀏覽器需正確自動斷行與縮放圖片。

---

## 7. 下一步建議

這份規格書已經將「Notion 式編輯」與「多語系 CMS」深度結合。**為了讓你更順利地進入開發階段，我可以幫你：**

1. **繪製編輯器的 Block 拖拽組件邏輯圖**（說明 `dnd-kit` 如何與 `Tiptap` 溝通）。
2. **設計 `file_objects` 的上傳狀態機**（從 Pending -> Uploading -> Success 的 UI 變化）。
3. **提供一個符合 SEO 規範的 SSR 頁面 HTML 結構範本**。

uiux mockup
```
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Search, 
  Plus, 
  MoreHorizontal, 
  GripVertical, 
  Globe, 
  ChevronRight, 
  Eye, 
  Send, 
  ChevronDown,
  Info,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  X,
  Type,
  Heading2,
  Trash2,
  Upload,
  Filter,
  Download,
  FileIcon,
  HardDrive
} from 'lucide-react';

// --- 模擬數據 ---
const MOCK_POSTS = [
  { id: 1, title: '如何使用 R3 CMS 提升 SEO 排名', slug: 'how-to-optimize-seo', status: 'published', author: '張小明', lastUpdated: '2023-10-25 14:20', locales: ['zh-TW', 'en'] },
  { id: 2, title: '2024 年內容行銷趨勢', slug: 'content-marketing-trends-2024', status: 'draft', author: '李小華', lastUpdated: '2023-10-24 09:15', locales: ['zh-TW'] },
  { id: 3, title: '產品發佈：R3c 資源管理器上線', slug: 'r3c-asset-manager-launch', status: 'archived', author: '王大同', lastUpdated: '2023-10-20 16:45', locales: ['zh-TW', 'en', 'jp'] },
];

const MOCK_ASSETS = [
  { id: 'a1', name: 'hero-banner.jpg', size: '1.2MB', type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400', date: '2023-10-25' },
  { id: 'a2', name: 'office-collaboration.png', size: '2.5MB', type: 'image/png', url: 'https://images.unsplash.com/photo-1522071823991-b1ae5e6a305a?auto=format&fit=crop&q=80&w=400', date: '2023-10-24' },
  { id: 'a3', name: 'data-chart-dark.svg', size: '45KB', type: 'image/svg+xml', url: 'https://images.unsplash.com/photo-1551288049-bbda38a10ad5?auto=format&fit=crop&q=80&w=400', date: '2023-10-23' },
  { id: 'a4', name: 'product-shot-01.jpg', size: '890KB', type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400', date: '2023-10-22' },
  { id: 'a5', name: 'team-workshop.jpg', size: '1.8MB', type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400', date: '2023-10-21' },
  { id: 'a6', name: 'abstract-bg.png', size: '3.1MB', type: 'image/png', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=400', date: '2023-10-20' },
];

const INITIAL_BLOCKS = [
  { id: 'b1', type: 'h1', content: '如何使用 R3 CMS 提升 SEO 排名' },
  { id: 'b2', type: 'p', content: '內容創作不再只是寫字，而是在於結構化的表達。這篇文章將帶你了解如何運用 R3 的區塊化編輯器...' },
  { id: 'b3', type: 'image', content: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000', alt: '寫作儀表板' },
  { id: 'b4', type: 'h2', content: '1. 理解關鍵字權重' },
  { id: 'b5', type: 'p', content: '在 R3 中，你可以直接在右側面板設定 Meta Title，這會覆蓋原本的文章標題以優化搜尋引擎顯示。' },
];

const App = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'edit' | 'assets'
  const [selectedPost, setSelectedPost] = useState(null);
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [activeLocale, setActiveLocale] = useState('zh-TW');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // 模擬自動儲存
  useEffect(() => {
    if (currentView === 'edit') {
      const timer = setInterval(() => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 800);
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [currentView]);

  // --- 內容操作邏輯 ---
  const handleEditPost = (post) => {
    setSelectedPost(post);
    setCurrentView('edit');
  };

  const updateBlock = (id, newContent) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const addBlock = (index, type) => {
    const newBlock = {
      id: `b-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      content: type === 'image' ? MOCK_ASSETS[0].url : (type === 'h2' ? '新標題' : '點擊開始輸入內容...'),
      alt: type === 'image' ? '新圖片描述' : undefined
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  // --- 拖拽邏輯 ---
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newBlocks = [...blocks];
    const draggedItem = newBlocks[draggedIdx];
    newBlocks.splice(draggedIdx, 1);
    newBlocks.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setBlocks(newBlocks);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700 border-green-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      archived: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    const labels = { published: '已發佈', draft: '草稿', archived: '已歸檔' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 側邊導覽 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold italic shadow-lg shadow-indigo-200">R3</div>
          <span className="font-bold text-lg tracking-tight">Content Hub</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="儀表板" />
          <NavItem 
            icon={<FileText size={20} />} 
            label="所有文章" 
            active={currentView === 'list' || currentView === 'edit'} 
            onClick={() => setCurrentView('list')}
          />
          <NavItem 
            icon={<ImageIcon size={20} />} 
            label="媒體庫" 
            active={currentView === 'assets'} 
            onClick={() => setCurrentView('assets')}
          />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">系統設定</div>
          <NavItem icon={<Settings size={20} />} label="一般設定" />
          <NavItem icon={<Globe size={20} />} label="語系與翻譯" />
        </nav>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentView === 'list' && (
          <PostListView onEdit={handleEditPost} getStatusBadge={getStatusBadge} />
        )}
        {currentView === 'edit' && (
          <EditorView 
            post={selectedPost} 
            blocks={blocks} 
            updateBlock={updateBlock}
            deleteBlock={deleteBlock}
            addBlock={addBlock}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            activeLocale={activeLocale}
            setActiveLocale={setActiveLocale}
            isSaving={isSaving}
            onBack={() => setCurrentView('list')} 
          />
        )}
        {currentView === 'assets' && (
          <AssetLibraryView />
        )}
      </main>
    </div>
  );
};

// --- 子組件 ---

const NavItem = ({ icon, label, active = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`}>
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </div>
);

const PostListView = ({ onEdit, getStatusBadge }) => (
  <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500">
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      <h1 className="text-xl font-bold text-slate-800">所有文章</h1>
      <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95">
        <Plus size={18} /> 新增文章
      </button>
    </header>

    <div className="p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜尋標題、Slug 或內容..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">文章標題</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">狀態</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">最後更新</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_POSTS.map(post => (
              <tr key={post.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => onEdit(post)}>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{post.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">/{post.slug}</div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-right font-mono text-xs">{post.lastUpdated}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// --- 媒體庫組件 ---
const AssetLibraryView = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-4 duration-500 bg-white">
      <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800">媒體庫</h1>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">R3c</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-4">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'all' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              全部
            </button>
            <button 
              onClick={() => setFilter('images')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'images' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              圖片
            </button>
            <button 
              onClick={() => setFilter('docs')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'docs' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              文件
            </button>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95">
            <Upload size={18} /> 上傳資源
          </button>
        </div>
      </header>

      <div className="p-8 flex-1 overflow-y-auto bg-slate-50/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜尋資源名稱..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm shadow-sm"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm">
              <Filter size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <HardDrive size={14} /> 儲存空間：2.4 GB / 10 GB
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {MOCK_ASSETS.map((asset) => (
            <div key={asset.id} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white rounded-lg text-slate-900 hover:bg-indigo-600 hover:text-white transition-colors shadow-lg">
                    <Download size={16} />
                  </button>
                  <button className="p-2 bg-white rounded-lg text-slate-900 hover:bg-red-500 hover:text-white transition-colors shadow-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-slate-800 truncate mb-1">{asset.name}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>{asset.size}</span>
                  <span>{asset.date}</span>
                </div>
              </div>
            </div>
          ))}
          {/* 上傳佔位區 */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center aspect-square text-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-400 cursor-pointer transition-all">
            <Plus size={32} />
            <span className="text-xs font-bold mt-2">點擊上傳</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorView = ({ 
  post, blocks, updateBlock, deleteBlock, addBlock, 
  handleDragStart, handleDragOver, handleDragEnd,
  activeLocale, setActiveLocale, isSaving, onBack 
}) => {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-500">
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all active:scale-90">
            <ChevronLeft size={20} />
          </button>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2 text-sm">
            <Globe size={16} className="text-slate-400" />
            <select 
              value={activeLocale}
              onChange={(e) => setActiveLocale(e.target.value)}
              className="font-semibold bg-transparent focus:outline-none cursor-pointer hover:text-indigo-600"
            >
              <option value="zh-TW">繁體中文 (zh-TW)</option>
              <option value="en">English (US)</option>
              <option value="jp">日本語 (JP)</option>
            </select>
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 animate-pulse ml-4 font-medium">
                <Clock size={12} /> 儲存中...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-4 font-medium">
                <CheckCircle2 size={12} className="text-green-500" /> 已儲存
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <Eye size={18} /> 預覽
          </button>
          <button className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
            <Send size={18} /> 發佈更新
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto px-12 py-16 scroll-smooth">
          <div className="max-w-2xl mx-auto pb-64">
            <div className="group relative mb-8">
              <input 
                type="text" 
                defaultValue={post.title}
                placeholder="輸入文章標題..."
                className="w-full text-4xl font-extrabold text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent leading-tight"
              />
            </div>

            <div className="space-y-1">
              {blocks.map((block, index) => (
                <EditorBlock 
                  key={block.id} 
                  block={block} 
                  index={index}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onAdd={addBlock}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                />
              ))}
              
              <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl mt-12 hover:border-indigo-200 hover:bg-indigo-50/30 group transition-all cursor-pointer">
                <button 
                  onClick={() => addBlock(blocks.length - 1, 'p')}
                  className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-indigo-500 transition-colors"
                >
                  <Plus size={32} />
                  <span className="text-sm font-bold tracking-tight">新增區塊</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col shrink-0">
          <div className="flex border-b border-slate-200 bg-white">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
            >
              文章設定
            </button>
            <button 
              onClick={() => setActiveTab('seo')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'seo' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
            >
              SEO 優化
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {activeTab === 'settings' ? (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">發佈狀態</label>
                  <div className="relative">
                    <select 
                      defaultValue="已發佈 (Published)"
                      className="w-full pl-3 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm"
                    >
                      <option>草稿 (Draft)</option>
                      <option>已發佈 (Published)</option>
                      <option>已歸檔 (Archived)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">網址代稱 (Slug)</label>
                  <input 
                    type="text" 
                    defaultValue={post.slug}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">精選圖片</label>
                  <div className="group aspect-video bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-400 cursor-pointer transition-all shadow-sm overflow-hidden relative">
                    <img src={MOCK_ASSETS[0].url} className="w-full h-full object-cover opacity-50 absolute" />
                    <div className="relative z-10 flex flex-col items-center bg-white/80 p-3 rounded-xl shadow-lg">
                      <ImageIcon size={24} />
                      <span className="text-[10px] font-bold mt-1">更換精選圖</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600 mb-3 font-bold text-xs uppercase tracking-tight">
                    <Info size={14} /> SEO 健康度
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[92%] transition-all duration-1000"></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">您的標題與描述長度適中，有利於搜尋曝光。</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SEO 標題</label>
                  <input type="text" placeholder="建議 60 字以內" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm" />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const EditorBlock = ({ block, index, onUpdate, onDelete, onAdd, onDragStart, onDragOver, onDragEnd }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const contentRef = useRef(null);

  const handleBlur = () => {
    if (contentRef.current) {
      onUpdate(block.id, contentRef.current.innerText);
    }
  };

  return (
    <div 
      className="group relative flex items-start transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      draggable={true}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Notion Handle */}
      <div className={`absolute -left-12 top-1 flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <Plus size={16} />
          </button>
          
          {showMenu && (
            <div className="absolute top-8 left-0 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in duration-200 ring-4 ring-slate-100">
              <div className="px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">新增區塊</div>
              <MenuOption icon={<Type size={14}/>} label="文字段落" onClick={() => { onAdd(index, 'p'); setShowMenu(false); }} />
              <MenuOption icon={<Heading2 size={14}/>} label="標題" onClick={() => { onAdd(index, 'h2'); setShowMenu(false); }} />
              <MenuOption icon={<ImageIcon size={14}/>} label="圖片" onClick={() => { onAdd(index, 'image'); setShowMenu(false); }} />
              <div className="h-[1px] bg-slate-100 my-1"></div>
              <MenuOption icon={<Trash2 size={14}/>} label="刪除區塊" danger onClick={() => onDelete(block.id)} />
            </div>
          )}
        </div>
        <div className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
      </div>

      <div className="w-full">
        {block.type === 'h1' && (
          <h1 className="text-3xl font-extrabold py-2 outline-none text-slate-900 tracking-tight">{block.content}</h1>
        )}
        {block.type === 'h2' && (
          <h2 
            ref={contentRef}
            contentEditable 
            onBlur={handleBlur}
            suppressContentEditableWarning
            className="text-2xl font-bold py-2 mt-6 mb-2 outline-none focus:bg-slate-50 rounded px-1 text-slate-800"
          >
            {block.content}
          </h2>
        )}
        {block.type === 'p' && (
          <div 
            ref={contentRef}
            className="text-slate-600 py-2 leading-relaxed outline-none min-h-[1.5em] focus:bg-slate-50 rounded px-1 whitespace-pre-wrap" 
            contentEditable 
            onBlur={handleBlur}
            suppressContentEditableWarning
          >
            {block.content}
          </div>
        )}
        {block.type === 'image' && (
          <div className="my-6 group/img relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-sm">
            <img src={block.content} alt={block.alt} className="w-full h-auto object-cover max-h-[500px] pointer-events-none" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
              <button className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <ImageIcon size={14} /> 從媒體庫更換
              </button>
            </div>
            {block.alt && <p className="p-4 text-xs text-slate-400 text-center italic font-medium">{block.alt}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const MenuOption = ({ icon, label, onClick, danger = false }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
      danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;

```
