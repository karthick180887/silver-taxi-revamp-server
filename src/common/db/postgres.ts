import { Sequelize, QueryTypes } from 'sequelize';
import { TableWithSequence } from "../types/config";
import env from "../../utils/env";

// Development Sequelize instance
const sequelizeDev: any = new Sequelize({
  dialect: "postgres",
  replication: {
    read: [
      {
        host: env.POSTGRES_HOST,
        port: Number(env.POSTGRES_PORT),
        username: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        database: 'replica',
      },
    ],
    write: {
      host: env.POSTGRES_HOST,
      port: Number(env.POSTGRES_PORT),
      username: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
    },
  },
  logging: false,
  pool: {
    max: 15,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: env.POSTGRES_SSL === 'disable' ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Production Sequelize instance
const sequelizeProd = new Sequelize({
  dialect: "postgres",
  host: env.POSTGRES_HOST_PROD,          // silvertaxi-do-user-xxxxxxx.m.db.ondigitalocean.com
  port: Number(env.POSTGRES_PORT_PROD), // 25060
  username: env.POSTGRES_USER_PROD,     // doadmin
  password: env.POSTGRES_PASSWORD_PROD, // your password
  database: env.POSTGRES_DB_PROD,       // defaultdb or your DB name
  logging: false,
  pool: {
    max: 15,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const sequelize = env.NODE_ENV === 'production' ? sequelizeProd : sequelizeDev;

async function connect() {
  try {
    await sequelize.authenticate();
    // await resetTableSequences();
    console.warn(`[db] connected  " ${env.NODE_ENV} "`);
  } catch (error) {
    console.error(`[db] unable to connect: " ${env.NODE_ENV} "`, error);
    process.exit(1);
  }
}

// async function resetTableSequences(): Promise<{ tableWithSequences: TableWithSequence[], tableWithError: string[] }> {

//   // Prepare an array to store table and sequence info
//   const tableWithSequences: TableWithSequence[] = [];
//   const tableWithError: string[] = [];

//   try {
//     // Step 1: Fetch all table names
//     const tableNames = await sequelize.query(
//       `SELECT table_name
//        FROM information_schema.tables
//        WHERE table_schema = 'public'
//        AND table_type = 'BASE TABLE'`,
//       { type: QueryTypes.SELECT }
//     );

//     // console.log("STEP 1: ", tableNames);


//     // Step 2: Loop through each table to fetch its max ID and reset its sequence
//     for (const table of tableNames) {
//       try {
//         const tableName = table.table_name;

//         // Determine the data count for the current table
//         const tableCount = await sequelize.query(
//           `SELECT COUNT(*) AS count FROM "${tableName}"`,
//           { type: QueryTypes.SELECT }
//         );

//         const count = tableCount[0]?.count || 0; // Default to 0 if no rows are found
//         // console.log("STEP 2: tableCount", tableName, tableCount, count);

//         // If no primary key is found, skip this table
//         if (count == 0) {
//           console.log(`No Data found for table: ${tableName}`);
//           continue;
//         }
//         // console.log("STEP 2: tableCount continue");

//         // Fetch the maximum ID using the actual primary key column name
//         const maxIdResult = await sequelize.query(
//           `SELECT MAX(id) AS max_id FROM "${tableName}"`,
//           { type: QueryTypes.SELECT }
//         );

//         const maxId = maxIdResult[0]?.max_id || 0; // Default to 0 if no rows are found
//         // console.log("STEP 2: maxIdResult", tableName, maxIdResult, maxId);

//         // Reset the sequence if maxId is not null
//         const sequenceName = `"${tableName}_id_seq"`; // Assuming standard naming convention for sequences
//         if (maxId !== null) {
//           await sequelize.query(
//             `ALTER SEQUENCE ${sequenceName} RESTART WITH ${maxId + 1}`
//           );
//         }

//         // Fetch the sequence information
//         const sequenceInfo = await sequelize.query(
//           `SELECT * FROM ${sequenceName}`,
//           { type: QueryTypes.SELECT }
//         );

//         // console.log("STEP 2: sequenceInfo", tableName, sequenceInfo);
//         // Add to the result array
//         tableWithSequences.push({
//           tableName: tableName,
//           sequence: sequenceInfo.length ? sequenceInfo[0] : null,
//         });
//         // Print or return the table and sequence info
//         // console.log('Tables and their Sequences:', tableWithSequences);
//       } catch (error) {
//         console.error('Error resetting sequences or fetching table names:', error);
//         tableWithError.push(table.table_name)
//       }
//     }

//     // Print or return the table and sequence info
//     console.log('Tables and their Sequences:', { tableWithSequences, tableWithError });
//   } catch (error) {
//     console.error('Error resetting sequences or fetching table names:', error);
//   }
//   return { tableWithSequences, tableWithError }
// }

export { sequelize, connect };
