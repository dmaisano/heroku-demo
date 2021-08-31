declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    DB_NAME?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USER?: string;
    DB_PASS?: string;
    REDIS_URL: string;
    PORT: string;
    SESSION_SECRET: string;
  }
}

//rrpblelalprgmf:5d31b1a5171a9eefc844cd7859f0bf8a6a299b119d42c23cce35b1dadd0a851b@ec2-52-6-211-59.compute-1.amazonaws.com:5432/d98sdlnhjubn88

postgres: DATABASE_URL =
  "postgres://postgres:postgres@postgres:5432/postgres?sslmode=disable";
