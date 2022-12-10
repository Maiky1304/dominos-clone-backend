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
          .expectStatus(409)
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

  describe('Users', () => {
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

  describe('Stores', () => {
    const storeData = {
      name: 'e2e test store',
      address: 'e2e test address',
    };

    describe('create store', () => {
      it('should not work without admin role', async () => {
        await pactum
          .spec()
          .post('/stores/create')
          .withBody({
            address: storeData.address,
          })
          .expectStatus(401)
          .toss();
      });

      it('should not work if name is empty/not provided', async () => {
        await pactum
          .spec()
          .post('/stores/create')
          .withBody({
            address: storeData.address,
          })
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(400)
          .toss();
      });

      it('should not work if address is empty/not provided', async () => {
        await pactum
          .spec()
          .post('/stores/create')
          .withBody({
            name: storeData.name,
          })
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(400)
          .toss();
      });

      it('should work if request is complete', async () => {
        await pactum
          .spec()
          .post('/stores/create')
          .withBody(storeData)
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(201)
          .expectBodyContains(storeData.name)
          .stores('store_id', 'id')
          .toss();
      });

      it('should not work if duplicate is trying to be created', async () => {
        await pactum
          .spec()
          .post('/stores/create')
          .withBody(storeData)
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(409)
          .expectBodyContains('Store with this name or address already exists')
          .toss();
      });
    });
    describe('find all stores', () => {
      it('should not work without admin role', async () => {
        await pactum.spec().get('/stores').expectStatus(401).toss();
      });

      it('should work with admin role', async () => {
        await pactum
          .spec()
          .get('/stores')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(200)
          .toss();
      });

      it('should have one item', async () => {
        await pactum
          .spec()
          .get('/stores')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(200)
          .expectJsonLength(1)
          .toss();
      });
    });
    describe('find store by id', () => {
      it('should not work without admin role', async () => {
        await pactum
          .spec()
          .get('/stores/{id}')
          .withPathParams('id', '$S{store_id}')
          .expectStatus(401)
          .toss();
      });

      it('should work with admin role', async () => {
        await pactum
          .spec()
          .get('/stores/{id}')
          .withPathParams('id', '$S{store_id}')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(200)
          .toss();
      });

      it('response body should be present', async () => {
        await pactum
          .spec()
          .get('/stores')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(200)
          .expectBodyContains(storeData.name)
          .toss();
      });
    });
    describe('update store by id', () => {
      const update = {
        name: 'e2e test store updated',
      };

      it('should not work without admin role', async () => {
        await pactum
          .spec()
          .patch('/stores/{id}')
          .withPathParams('id', '$S{store_id}')
          .withBody(update)
          .expectStatus(401)
          .toss();
      });

      it('should work with admin role', async () => {
        await pactum
          .spec()
          .get('/stores/{id}')
          .withPathParams('id', '$S{store_id}')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .withBody(update)
          .expectStatus(200)
          .toss();
      });
    });
    describe('delete store by id', () => {
      it('should not work without admin role', async () => {
        await pactum
          .spec()
          .delete('/stores/{id}')
          .withPathParams('id', '$S{store_id}')
          .expectStatus(401)
          .toss();
      });

      it('should work with admin role', async () => {
        await pactum
          .spec()
          .delete('/stores/{id}')
          .withPathParams('id', '$S{store_id}')
          .withHeaders({
            Authorization: 'Bearer $S{admin_token}',
          })
          .expectStatus(204)
          .toss();
      });
    });
  });
});
