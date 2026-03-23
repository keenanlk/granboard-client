import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV ?? "development"}` });
config(); // also load .env if it exists
