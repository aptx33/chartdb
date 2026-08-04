import { describe, expect, it } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import { importDBMLToDiagram } from '../dbml-import';
import { getDBMLImportErrorMessage } from '../dbml-import-error';

const dbmlWithExpressionIndex = `
Table orders {
  id int [pk]
  created_at timestamp

  indexes {
    (\`created_at::date\`) [name: 'idx_orders_created_date']
  }
}
`;

describe('DBML import error message', () => {
    it('exposes conversion errors that are not parser syntax errors', async () => {
        try {
            await importDBMLToDiagram(dbmlWithExpressionIndex, {
                databaseType: DatabaseType.POSTGRESQL,
            });
            expect.unreachable('Expected the expression index import to fail');
        } catch (error) {
            expect(getDBMLImportErrorMessage(error)).toBe(
                'Index references non-existent column: created_at::date'
            );
        }
    });

    it('returns null when an unknown error has no useful message', () => {
        expect(getDBMLImportErrorMessage({ code: 'IMPORT_FAILED' })).toBeNull();
    });
});
