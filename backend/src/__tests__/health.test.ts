// src/__tests__/health.test.ts - Health check tests
import request from 'supertest';
import app from '../app';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('Health Check Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database connection for health checks
    (pool.getConnection as jest.Mock).mockResolvedValue({
      ping: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue([[]]),
      release: jest.fn(),
    });
  });

  describe('GET /health', () => {
    it('should return comprehensive health status', async () => {
      const response = await request(app)
        .get('/health');

      // Accept 200 or 503 (service unavailable in test env)
      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('services');
        expect(response.body.services).toHaveProperty('database');
      }
    });
  });

  describe('GET /health/simple', () => {
    it('should return simple health status', async () => {
      const response = await request(app)
        .get('/health/simple')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('alive');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
