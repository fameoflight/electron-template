import { DataSource } from 'typeorm';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserDataPath } from './main/base/utils/common/paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for TypeORM CLI (migrations)
export default new DataSource({
  type: 'sqlite',
  database: path.join(getUserDataPath(), "db.sqlite"),
  entities: ['main/db/entities/**/*.ts'],
  migrations: ['main/db/migrations/**/*.ts'],
  synchronize: false,
  logging: true,
});
