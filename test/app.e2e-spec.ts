import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import * as argon from 'argon2';

describe('Dominos Clone', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const adminData = {
    email: 'admin@e2e.test',
    password: 'admin',
    firstName: 'Admin',
    lastName: 'Admin',
  };

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
    await prisma.user.create({
      data: {
        ...adminData,
        password: await argon.hash(adminData.password),
        role: 'ADMIN',
      },
    });

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

      it('should login admin user', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson(adminData)
          .expectStatus(200)
          .stores('admin_token', 'access_token')
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
          .stores('user_id', 'id')
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

    describe('find all', () => {
      it('should not work without "admin" role', async () => {
        await pactum
          .spec()
          .get('/users')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(403)
          .expectBodyContains(
            "You don't have permission to access this resource.",
          )
          .toss();
      });

      it('should work with "admin" role', async () => {
        await pactum
          .spec()
          .get('/users')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(200)
          .toss();
      });
    });

    describe('find by id', () => {
      it('should not work without "admin" role', async () => {
        await pactum
          .spec()
          .get('/users/{id}')
          .withPathParams('id', '$S{user_id}')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(403)
          .expectBodyContains(
            "You don't have permission to access this resource.",
          )
          .toss();
      });

      it('should work with "admin" role', async () => {
        await pactum
          .spec()
          .get('/users/{id}')
          .withPathParams('id', '$S{user_id}')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(200)
          .toss();
      });
    });

    describe('update by id', () => {
      const update = {
        firstName: 'updated first name',
      };

      it('should not work without "admin" role', async () => {
        await pactum
          .spec()
          .patch('/users/{id}')
          .withPathParams('id', '$S{user_id}')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .withBody(update)
          .expectStatus(403)
          .expectBodyContains(
            "You don't have permission to access this resource.",
          )
          .toss();
      });

      it('should work with "admin" role', async () => {
        await pactum
          .spec()
          .patch('/users/{id}')
          .withPathParams('id', '$S{user_id}')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .withBody(update)
          .expectStatus(200)
          .expectBodyContains(update.firstName)
          .toss();
      });
    });

    describe('delete by id', () => {
      it('should not work without "admin" role', async () => {
        await pactum
          .spec()
          .delete('/users/{id}')
          .withPathParams('id', '$S{user_id}')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(403)
          .expectBodyContains(
            "You don't have permission to access this resource.",
          )
          .toss();
      });

      it('should work with "admin" role', async () => {
        await pactum
          .spec()
          .delete('/users/{id}')
          .withPathParams('id', '$S{user_id}')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(204)
          .toss();
      });
    });
  });
});
