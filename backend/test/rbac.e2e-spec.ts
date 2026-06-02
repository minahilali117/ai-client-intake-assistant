import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let developerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'developer@example.com', password: 'Developer123!' });

    developerToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('developer cannot create leads', () => {
    return request(app.getHttpServer())
      .post('/leads')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        companyName: 'Blocked Co',
        contactPerson: 'X',
        email: 'x@test.com',
        source: 'Web',
      })
      .expect(403);
  });

  it('developer can list leads (qualified filter applied server-side)', () => {
    return request(app.getHttpServer())
      .get('/leads')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);
  });
});
