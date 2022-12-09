import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';

describe('Dominos Clone', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3336);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3336');
  });

  afterAll(() => {
    app.close();
  });

  const authData = {
    email: 'john.doe@e2e.test',
    password: 'password',
  };
  const personalData = {
    firstName: 'John',
    lastName: 'Doe',
  };

  describe('Auth', () => {
    describe('registration', () => {
      it('should throw error if email empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withJson({
            email: '',
            password: authData.password,
            ...personalData,
          })
          .expectStatus(400)
          .toss();
      });

      it('should throw error if password empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withJson({
            email: authData.email,
            password: '',
            ...personalData,
          })
          .expectStatus(400)
          .toss();
      });

      it('should throw error if first name empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withJson({
            ...authData,
            firstName: '',
            lastName: personalData.lastName,
          })
          .expectStatus(400)
          .toss();
      });

      it('should throw error if last name empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withJson({
            ...authData,
            firstName: personalData.firstName,
            lastName: '',
          })
          .expectStatus(400)
          .toss();
      });

      it('should create account', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withJson({
            ...authData,
            ...personalData,
          })
          .expectStatus(201)
          .toss();
      });

      it('should throw error if email already exists', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withJson({
            ...authData,
            ...personalData,
          })
          .expectStatus(403)
          .toss();
      });
    });
    describe('login', () => {
      it('should throw error if email empty', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: '',
            password: authData.password,
          })
          .expectStatus(400)
          .toss();
      });

      it('should throw error if password empty', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: authData.email,
            password: '',
          })
          .expectStatus(400)
          .toss();
      });

      it('should throw error if email not found', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: 'invalidmail@e2e.test',
            password: authData.password,
          })
          .expectStatus(403)
          .toss();
      });

      it('should throw error if password invalid', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: authData.email,
            password: 'somepassword',
          })
          .expectStatus(403)
          .toss();
      });

      it('should login', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson(authData)
          .expectStatus(200)
          .stores('token', 'access_token')
          .toss();
      });
    });
  });

  describe('User', () => {
    describe('identify', () => {
      it('should identify user by token', async () => {
        await pactum
          .spec()
          .get('/users/identify')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(200)
          .expectBodyContains(authData.email)
          .expectBodyContains(personalData.firstName)
          .expectBodyContains(personalData.lastName)
          .toss();
      });

      it('should throw forbidden if token invalid', async () => {
        await pactum
          .spec()
          .get('/users/identify')
          .withHeaders({
            Authorization: 'Bearer obviousinvalidtoken',
          })
          .expectStatus(401)
          .toss();
      });
    });
  });
});
