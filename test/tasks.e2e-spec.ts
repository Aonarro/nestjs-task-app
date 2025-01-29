import { AppModule } from '../src/app.module';
import { TaskStatus } from '../src/tasks/task.model';
import { TestSetup } from './test-setup';
import * as request from 'supertest';

describe('Tasks (e2e)', () => {
  let testSetup: TestSetup;
  let authToken: string;
  let taskId: string;

  const testUser = {
    email: 'test@example.com',
    password: '12345678QQ.',
    name: 'aonarro',
  };

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);

    authToken = loginResponse.body.access_token;

    const response = await request(testSetup.app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task',
        description: 'Test Desc',
        status: TaskStatus.OPEN,
        labels: [{ name: 'test' }],
      });

    taskId = response.body.id;
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('should not allow access to other users tasks', async () => {
    const otherUser = {
      ...testUser,
      email: 'otherUser@gmail.com',
    };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(otherUser)
      .expect(201);

    const otherToken = loginResponse.body.access_token;

    await request(testSetup.app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });

  it('should list users tasks only', async () => {
    await request(testSetup.app.getHttpServer())
      .get(`/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.meta.total).toBe(1);
      });

    const otherUser = {
      ...testUser,
      email: 'otherUser@gmail.com',
    };
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(otherUser)
      .expect(201);

    const otherToken = loginResponse.body.access_token;

    await request(testSetup.app.getHttpServer())
      .get(`/tasks`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.meta.total).toBe(0);
      });
  });
});
