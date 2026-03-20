import {
  and,
  getTableColumns,
  isNull,
  type InferInsertModel,
  type SQLWrapper,
  type SQL,
} from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import type { AppDrizzleDb, TransactionClient } from './drizzle.types';
import { asyncLocalStorage } from '../context/user-context';

type DbClient = AppDrizzleDb | TransactionClient;

function hasColumn(table: AnyPgTable, columnName: string): boolean {
  return columnName in getTableColumns(table);
}

function getColumn(table: AnyPgTable, columnName: string) {
  return getTableColumns(table)[columnName as keyof ReturnType<typeof getTableColumns>];
}

function getCurrentUserId(): number | undefined {
  return asyncLocalStorage.getStore()?.userId;
}

function withAuditValues<T extends Record<string, unknown>>(
  table: AnyPgTable,
  values: T,
  mode: 'create' | 'update' | 'delete',
): T {
  const userId = getCurrentUserId();
  const nextValues = { ...values } as Record<string, unknown>;
  const now = new Date().toISOString();

  if (mode === 'create' && hasColumn(table, 'createdAt') && nextValues.createdAt === undefined) {
    nextValues.createdAt = now;
  }

  if (
    (mode === 'create' || mode === 'update') &&
    hasColumn(table, 'updatedAt') &&
    nextValues.updatedAt === undefined
  ) {
    nextValues.updatedAt = now;
  }

  if (
    mode === 'create' &&
    userId !== undefined &&
    hasColumn(table, 'createdBy') &&
    nextValues.createdBy === undefined
  ) {
    nextValues.createdBy = userId;
  }

  if (
    (mode === 'create' || mode === 'update') &&
    userId !== undefined &&
    hasColumn(table, 'updatedBy') &&
    nextValues.updatedBy === undefined
  ) {
    nextValues.updatedBy = userId;
  }

  if (mode === 'delete') {
    if (hasColumn(table, 'deletedAt') && nextValues.deletedAt === undefined) {
      nextValues.deletedAt = now;
    }
    if (userId !== undefined && hasColumn(table, 'deletedBy')) {
      nextValues.deletedBy = userId;
    }
  }

  return nextValues as T;
}

export function withSoftDelete<TWhere extends SQL | undefined>(table: AnyPgTable, where?: TWhere) {
  if (!hasColumn(table, 'deletedAt')) {
    return where;
  }

  const deletedAtColumn = getColumn(table, 'deletedAt');
  const filter = isNull(deletedAtColumn as never);
  return where ? and(where, filter) : filter;
}

export function joinOnWithSoftDelete<TTable extends AnyPgTable>(table: TTable, on: SQL) {
  return withSoftDelete(table, on) as SQL;
}

export function insertWithAudit<TTable extends AnyPgTable>(
  db: DbClient,
  table: TTable,
  values: InferInsertModel<TTable>,
) {
  const payload = withAuditValues(table, values, 'create');
  return db.insert(table).values(payload).returning();
}

export function updateWithAudit<TTable extends AnyPgTable>(
  db: DbClient,
  table: TTable,
  where: SQL,
  values: Partial<InferInsertModel<TTable>>,
) {
  const payload = withAuditValues(table, values, 'update') as Record<
    string,
    SQL | SQLWrapper | unknown
  >;
  return db
    .update(table)
    .set(payload as any)
    .where(where)
    .returning();
}

export function softDeleteWhere<TTable extends AnyPgTable>(
  db: DbClient,
  table: TTable,
  where: SQL,
) {
  const payload = withAuditValues(table, {}, 'delete') as Record<
    string,
    SQL | SQLWrapper | unknown
  >;
  return db
    .update(table)
    .set(payload as any)
    .where(where)
    .returning();
}
