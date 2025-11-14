import { getDatabasePath } from "@main/base";
import { getEntitiesArray } from "@main/db/dataSource";
import { createDataSource } from "@main/db/utils";

// Load migrations from the migrations directory
const getMigrations = () => {
  return ['main/db/migrations/*.ts'];
};

// Create DataSource specifically for migrations
// This ensures migrations run with the same entity configuration
// but allows TypeORM CLI to manage migration operations
export const dataSource = await createDataSource({
  database: getDatabasePath(),
  migrations: getMigrations(),
  entities: await getEntitiesArray(),
  synchronize: false
});