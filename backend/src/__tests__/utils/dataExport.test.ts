// src/__tests__/utils/dataExport.test.ts - Data export utility tests
import {
  toCSV,
  toJSON,
  exportSales,
  exportProducts,
} from '../../utils/dataExport';

describe('Data Export Utilities', () => {
  describe('toCSV', () => {
    it('should convert array of objects to CSV', () => {
      const data = [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 },
      ];

      const csv = toCSV(data);
      expect(csv).toContain('id,name,price');
      expect(csv).toContain('1,Product A,100');
      expect(csv).toContain('2,Product B,200');
    });

    it('should handle empty array', () => {
      const csv = toCSV([]);
      expect(csv).toBe('');
    });

    it('should handle null values', () => {
      const data = [{ id: 1, name: null, price: 100 }];
      const csv = toCSV(data);
      expect(csv).toContain('1,,100');
    });

    it('should handle special characters', () => {
      const data = [{ id: 1, name: 'Product, with comma', price: 100 }];
      const csv = toCSV(data);
      expect(csv).toContain('"Product, with comma"');
    });
  });

  describe('toJSON', () => {
    it('should convert array to JSON string', () => {
      const data = [{ id: 1, name: 'Product A' }];
      const json = toJSON(data);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(data);
    });

    it('should pretty print when requested', () => {
      const data = [{ id: 1, name: 'Product A' }];
      const json = toJSON(data, true);
      expect(json).toContain('\n');
    });
  });
});
