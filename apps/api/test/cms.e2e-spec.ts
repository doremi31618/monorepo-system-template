import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('CmsController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    let postId: string;

    it('/cms/posts (POST) - Create Post', async () => {
        return request(app.getHttpServer())
            .post('/cms/posts')
            .send({ title: 'E2E Test Post', locale: 'en' })
            .expect(201)
            .then(response => {
                const data = response.body.data;
                expect(data.id).toBeDefined();
                expect(data.status).toBe('draft');
                expect(data.content.title).toBe('E2E Test Post');
                postId = data.id;
            });
    });

    it('/cms/posts/:id (GET) - Get Post', async () => {
        return request(app.getHttpServer())
            .get(`/cms/posts/${postId}`)
            .expect(200)
            .then(response => {
                const data = response.body.data;
                expect(data.id).toBe(postId);
                expect(data.content.title).toBe('E2E Test Post');
            });
    });

    it('/cms/posts/:id/content (PUT) - Update Content', async () => {
        return request(app.getHttpServer())
            .put(`/cms/posts/${postId}/content?locale=en`)
            .send({ title: 'Updated E2E Post', body: { type: 'doc', content: [] } })
            .expect(200)
            .then(response => {
                const data = response.body.data;
                expect(data.content.title).toBe('Updated E2E Post');
                expect(data.content.body).toBeDefined();
            });
    });

    it('/cms/posts/:id/status (PATCH) - Publish Post', async () => {
        return request(app.getHttpServer())
            .patch(`/cms/posts/${postId}/status`)
            .send({ status: 'published', slug: 'e2e-test-post' })
            .expect(200)
            .then(response => {
                // Update returns array of 1
                // Wait, updatePostStatus returns `db.select()...` which is array
                const data = response.body.data;
                // It might be an array or single object depending on implementation wrapper
                // If service returns array, data is array.
                const updated = Array.isArray(data) ? data[0] : data;
                expect(updated.status).toBe('published');
                expect(updated.slug).toBe('e2e-test-post');
            });
    });
});
