
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Admin RBAC (e2e)', () => {
    let app: INestApplication;
    let superAdminToken: string;

    // Credentials matching config
    const superAdminCreds = { email: 'admin@system.com', password: 'admin123' };

    // Unique data for this run
    const timestamp = Date.now();
    const newAdminEmail = `test-admin-${timestamp}@example.com`;
    const editorEmail = `editor-${timestamp}@example.com`;
    const commonPassword = 'password123';
    const editorRoleName = `Editor-${timestamp}`;

    // Shared state
    let editorRoleId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('v1');
        await app.init();

        // 1. Login as SuperAdmin
        const loginRes = await request(app.getHttpServer())
            .post('/v1/auth/login')
            .send(superAdminCreds);

        if (loginRes.status !== 200) {
            console.error('SuperAdmin login failed body:', JSON.stringify(loginRes.body, null, 2));
            throw new Error('SuperAdmin login failed');
        }
        superAdminToken = loginRes.body.data.token;
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('User Management', () => {
        it('should allow SuperAdmin to create a new user', async () => {
            const res = await request(app.getHttpServer())
                .post('/v1/admin/users')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    email: newAdminEmail,
                    name: 'Test Admin',
                    password: commonPassword,
                    roleIds: ['admin'] // 'admin' is a seeded system role
                });

            expect(res.status).toBe(201);
            expect(res.body.data.email).toBe(newAdminEmail);
        });

        it('should list all users', async () => {
            const res = await request(app.getHttpServer())
                .get('/v1/admin/users')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ limit: 100 });

            expect(res.status).toBe(200);

            const listData = res.body.data;
            const items = listData.data || listData.items || listData;

            expect(Array.isArray(items)).toBe(true);
            const found = items.find((u: any) => u.email === newAdminEmail);
            expect(found).toBeDefined();
        });
    });

    describe('Role & Permission Management', () => {
        it('should allow SuperAdmin to create a new Role', async () => {
            const res = await request(app.getHttpServer())
                .post('/v1/admin/roles')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    name: editorRoleName,
                    description: 'Content Editor Role'
                });

            expect(res.status).toBe(201);

            const roleData = res.body.data;
            const role = Array.isArray(roleData) ? roleData[0] : roleData;

            editorRoleId = role.id;
            expect(editorRoleId).toBeDefined();
        });

        it('should assign permission to Editor role', async () => {
            // Get permissions first
            const permRes = await request(app.getHttpServer())
                .get('/v1/admin/permissions')
                .set('Authorization', `Bearer ${superAdminToken}`);

            const perms = Array.isArray(permRes.body.data) ? permRes.body.data : permRes.body.data.data;
            const firstPermId = perms?.[0]?.id || 'users.read';

            const res = await request(app.getHttpServer())
                .post(`/v1/admin/roles/${editorRoleId}/permissions`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    permissionIds: [firstPermId]
                });

            expect(res.status).toBe(201);
        });
    });

    describe('RBAC Enforcement', () => {
        it('should create Editor User, Login, and Access Allowed Resources', async () => {
            // 1. Create Editor User
            const createRes = await request(app.getHttpServer())
                .post('/v1/admin/users')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    email: editorEmail,
                    name: 'Editor User',
                    password: commonPassword,
                    roleIds: [editorRoleId]
                });

            expect(createRes.status).toBe(201);

            // 2. Login as Editor
            const loginRes = await request(app.getHttpServer())
                .post('/v1/auth/login')
                .send({ email: editorEmail, password: commonPassword });

            expect(loginRes.status).toBe(200);

            const editorToken = loginRes.body.data.token;
            expect(editorToken).toBeDefined();

            // 3. Try to access Profile (should be allowed)
            // AccessControlController has @Get('me') at 'admin/me'
            const profileRes = await request(app.getHttpServer())
                .get('/v1/admin/me')
                .set('Authorization', `Bearer ${editorToken}`);

            if (profileRes.status !== 200) {
                console.error('Profile Access Failed:', JSON.stringify(profileRes.body, null, 2));
            }
            expect(profileRes.status).toBe(200);
        });
    });
});
