import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TestSetup } from './test-setup';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/users/role.enum';
import { PasswordService } from '../src/users/password/password.service';
import { JwtService } from '@nestjs/jwt';
import { Roles } from '../src/users/decorators/roles.decorator';

describe('Authentication & Authorization (e2e)', () => {
  let testSetup: TestSetup;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  const testUser = {
    email: 'test@example.com',
    password: '12345678QQ.',
    name: 'aonarro',
  };

  it('should require auth', () => {
    return request(testSetup.app.getHttpServer()).get('/tasks').expect(401);
  });

  it('should allow public route access', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);
  });

  it('should include roles in JWT token', async () => {
    const userRepo = testSetup.app.get(getRepositoryToken(User));
    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: await testSetup.app
        .get(PasswordService)
        .hash(testUser.password),
    });
    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const decoded = testSetup.app
      .get(JwtService)
      .verify(response.body.access_token);

    expect(decoded.roles).toBeDefined();
    expect(decoded.roles).toContain(Role.ADMIN);
  });

  it('/auth/register (POST)', () => {
    return request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
        expect(res.body.name).toBe(testUser.name);
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('/auth/register (POST) - duplicate email', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    return await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('/auth/login (POST)', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(response.status).toBe(201);
    expect(response.body.access_token).toBeDefined();
  });

  it('/auth/profile (GET)', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = response.body.access_token;

    return await request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
        expect(res.body.name).toBe(testUser.name);
        // expect(res.body).not.toHaveProperty('password');
      });
  });

  it('/auth/admin (GET) - admin access', async () => {
    const userRepo = testSetup.app.get(getRepositoryToken(User));

    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: await testSetup.app
        .get(PasswordService)
        .hash(testUser.password),
    });

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = response.body.access_token;

    return request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('This is for admins only!!');
      });
  });

  it('/auth/admin (GET) - regular user denied access', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = response.body.access_token;

    return request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('/auth/register (GET) - attempting to register as an admin', async () => {
    const userAdmin = {
      ...testUser,
      Roles: [Role.ADMIN],
    };
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(userAdmin)
      .expect(201)
      .expect((res) => {
        expect(res.body.roles).toEqual([Role.USER]);
      });

    // const response = await request(testSetup.app.getHttpServer())
    //   .post('/auth/login')
    //   .send({ email: testUser.email, password: testUser.password });

    // const token = response.body.access_token;

    // return request(testSetup.app.getHttpServer())
    //   .get('/auth/admin')
    //   .set('Authorization', `Bearer ${token}`)
    //   .expect(403);
  });
});
