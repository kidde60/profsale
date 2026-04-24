// src/__tests__/auth.test.ts - Authentication tests
import request from 'supertest';
import app from '../app';

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        phone: '+256700123456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Business',
        businessType: 'retail',
        password: 'Test1234',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        phone: '+256700123456',
        // Missing other required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid phone number', async () => {
      const userData = {
        phone: 'invalid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Business',
        businessType: 'retail',
        password: 'Test1234',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        login: '+256700123456',
        password: 'Test1234',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const credentials = {
        login: '+256700123456',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
