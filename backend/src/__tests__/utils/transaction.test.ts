// src/__tests__/utils/transaction.test.ts - Transaction utility tests
import { withTransaction, executeTransactionQueries } from '../../utils/transaction';

// Mock database pool
jest.mock('../../config/database', () => ({
  pool: {
    getConnection: jest.fn(),
  },
}));

describe('Transaction Utilities', () => {
  describe('withTransaction', () => {
    it('should execute callback within transaction', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      const { pool } = require('../../config/database');
      pool.getConnection.mockResolvedValue(mockConnection);

      const result = await withTransaction(async (conn) => {
        await conn.execute('SELECT 1');
        return 'success';
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should rollback on error', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      const { pool } = require('../../config/database');
      pool.getConnection.mockResolvedValue(mockConnection);

      await expect(
        withTransaction(async () => {
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });
  });

  describe('executeTransactionQueries', () => {
    it('should execute multiple queries in transaction', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn()
          .mockResolvedValueOnce([{ insertId: 1 }])
          .mockResolvedValueOnce([{ insertId: 2 }]),
        commit: jest.fn(),
        release: jest.fn(),
      };

      const { pool } = require('../../config/database');
      pool.getConnection.mockResolvedValue(mockConnection);

      const queries = [
        { sql: 'INSERT INTO table1 VALUES (?)', params: [1] },
        { sql: 'INSERT INTO table2 VALUES (?)', params: [2] },
      ];

      const results = await executeTransactionQueries(queries);

      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });
  });
});
