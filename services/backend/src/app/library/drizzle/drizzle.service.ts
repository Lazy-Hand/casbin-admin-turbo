import { Inject, Injectable } from '@nestjs/common';
import type { InferInsertModel, SQL } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { DRIZZLE_DB } from './drizzle.constants';
import {
  insertWithAudit,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from './drizzle.helpers';
import type { AppDrizzleDb } from './drizzle.types';

@Injectable()
export class DrizzleService {
  constructor(@Inject(DRIZZLE_DB) private readonly database: AppDrizzleDb) {}

  get db(): AppDrizzleDb {
    return this.database;
  }

  select() {
    return this.database.select();
  }

  insert<TTable extends AnyPgTable>(table: TTable) {
    return this.database.insert(table);
  }

  update<TTable extends AnyPgTable>(table: TTable) {
    return this.database.update(table);
  }

  delete<TTable extends AnyPgTable>(table: TTable) {
    return this.database.delete(table);
  }

  findMany<TTable extends AnyPgTable>(table: TTable, where?: SQL) {
    return this.database
      .select()
      .from(table as any)
      .where(withSoftDelete(table, where));
  }

  async findFirst<TTable extends AnyPgTable>(table: TTable, where?: SQL) {
    const [row] = await this.database
      .select()
      .from(table as any)
      .where(withSoftDelete(table, where))
      .limit(1);

    return row ?? null;
  }

  insertWithAudit<TTable extends AnyPgTable>(table: TTable, values: InferInsertModel<TTable>) {
    return insertWithAudit(this.database, table, values);
  }

  updateWithAudit<TTable extends AnyPgTable>(
    table: TTable,
    where: SQL,
    values: Parameters<typeof updateWithAudit<TTable>>[3],
  ) {
    return updateWithAudit(this.database, table, where, values);
  }

  softDeleteWhere<TTable extends AnyPgTable>(table: TTable, where: SQL) {
    return softDeleteWhere(this.database, table, where);
  }
}
