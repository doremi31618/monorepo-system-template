import { CmsService } from './cms.service.js';

describe('CmsService search capability', () => {
	const service = new CmsService({} as any, { get: jest.fn() } as any);

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('maps the framework-neutral public query to the existing Nest CMS listing', async () => {
		const page = { data: [], page: 2, limit: 20, total: 0 };
		const list = jest.spyOn(service, 'listPublicPosts').mockResolvedValue(page);

		await expect(
			service.searchPublished({
				query: 'mcp',
				locale: 'zh-TW',
				tagSlug: 'platform',
				sort: 'popular',
				page: 2,
				limit: 20
			})
		).resolves.toBe(page);
		expect(list).toHaveBeenCalledWith(2, 20, 'zh-TW', {
			query: 'mcp',
			tagSlug: 'platform',
			sort: 'popular'
		});
	});

	it('maps the framework-neutral private query to the workspace listing', async () => {
		const page = { data: [], page: 1, limit: 10, total: 0 };
		const list = jest.spyOn(service, 'listPosts').mockResolvedValue(page);

		await expect(
			service.searchWorkspace({
				status: 'draft',
				updatedFrom: '2026-08-01',
				updatedTo: '2026-09-01'
			})
		).resolves.toBe(page);
		expect(list).toHaveBeenCalledWith(1, 10, 'en', {
			query: undefined,
			status: 'draft',
			tagId: undefined,
			updatedFrom: '2026-08-01',
			updatedTo: '2026-09-01'
		});
	});
});
