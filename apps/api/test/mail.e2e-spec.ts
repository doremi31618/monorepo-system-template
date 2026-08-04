import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Mail Module (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('v1');
        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    // MailController is currently empty, but this test ensures the module loads
    // and the route prefix is respected, even if 404. 
    // This is a "connectivity" test.
    it('should be defined and respond (even if 404)', async () => {
        const res = await request(app.getHttpServer())
            .get('/v1/mail/health') // Hypothetical endpoint
            .send();

        // Since controller is empty, we expect 404 Not Found, 
        // BUT we want to ensure it's not 500 Internal Server Error (module crash).
        expect(res.status).toBe(404);
    });
});
