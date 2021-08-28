declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_HOST: string;
    DATABASE_USER: string;
    DATABASE_PASS: string;
    DATABASE_NAME: string;
    REDIS_URL: string;
    PORT: string;
    SESSION_SECRET: string;
  }
}
