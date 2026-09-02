export type AssetStatus = 'pending' | 'ready' | 'deleted';

export interface Asset {
  id: string;
  storageKey: string;
  originalName?: string | null;
  status: AssetStatus;
  mimeType: string | null;
  size: number | null;
  visibility: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ListAssetsResponse {
  data: Asset[];
  page: number;
  limit: number;
  total?: number;
}

export interface InitUploadResponse {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
}
