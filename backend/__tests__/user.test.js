import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import {User} from '../models/userSchema.js';
import {dbConnection} from '../database/dbConnection.js'


beforeAll(async () => {
  const mongoURI = process.env.TEST_MONGODB_URI;
  await dbConnection(mongoURI);
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('User Authentication and Authorization Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/user/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '1234567890',
        role: 'Employer',
        password: 'testpassword',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('user');
  });

  it('should not register a user with existing email', async () => {
    const res = await request(app)
      .post('/api/v1/user/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '1234567890',
        role: 'Employer',
        password: 'testpassword',
      });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Email is Already Exist');
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/v1/user/login')
      .send({
        email: 'testuser@example.com',
        password: 'testpassword',
        role: 'Employer',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/user/login')
      .send({
        email: 'testuser@example.com',
        password: 'wrongpassword',
        role: 'Employer',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid Email or Password');
  });

  it('should not login with incorrect role', async () => {
    const res = await request(app)
      .post('/api/v1/user/login')
      .send({
        email: 'testuser@example.com',
        password: 'testpassword',
        role: 'Job Seeker',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User with this role is not found!');
  });

  it('should get the logged-in user', async () => {
    const loginRes = await request(app)
      .post('/api/v1/user/login')
      .send({
        email: 'testuser@example.com',
        password: 'testpassword',
        role: 'Employer',
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/v1/user/getUser')
      .set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('user');
  });

  it('should logout the logged-in user', async () => {
    const loginRes = await request(app)
      .post('/api/v1/user/login')
      .send({
        email: 'testuser@example.com',
        password: 'testpassword',
        role: 'Employer',
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/v1/user/logout')
      .set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User logged out Successfully!');
  });
});
