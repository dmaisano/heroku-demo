export const __prod__ = process.env.NODE_ENV === `production`;

export const DB_PORT = process.env.DB_PORT ? +process.env.DB_PORT : 5432;

export const DB_SSL = process.env.DB_SSL ? !!process.env.DB_SSL : false;

export const COOKIE_NAME = `heroku_cookie`;
