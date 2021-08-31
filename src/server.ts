import connectRedis from "connect-redis";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import { ConnectionOptions, createConnection } from "typeorm";
import { COOKIE_NAME, DB_PORT, __prod__ } from "./constants";
import { getTemplate } from "./utils";
import path from "path";
require("dotenv-safe").config({
  allowEmptyValues: true,
});

const main = async () => {
  const {
    DATABASE_URL,
    DB_HOST,
    DB_NAME,
    DB_PASS,
    DB_USER,
    PORT,
    REDIS_URL,
    SESSION_SECRET,
  } = process.env;

  console.log({ __prod__ });

  const connConfig: ConnectionOptions = {
    type: `postgres`,
    ssl: __prod__
      ? {
          rejectUnauthorized: false,
        }
      : false,
    logging: true,
    entities: [],
  };

  if (process.env.DATABASE_URL) {
    Object.assign(connConfig, {
      url: DATABASE_URL,
    } as ConnectionOptions);
  } else {
    Object.assign(connConfig, {
      host: DB_HOST,
      database: DB_NAME,
      port: DB_PORT,
      username: DB_USER,
      password: DB_PASS,
    } as ConnectionOptions);
  }

  console.log({ connConfig });

  const conn = await createConnection(connConfig);

  const RedisStore = connectRedis(session);
  const redisClient = new Redis(REDIS_URL, {
    // https://github.com/luin/ioredis#auto-reconnect
    retryStrategy: (times) => {
      const minute = 1000 * 60;
      let delay = minute;
      if (times >= 100 && times < 1000) {
        delay = minute * 2.5;
      } else if (times >= 1000 && times < 10000) {
        delay = minute * 5;
      } else if (times >= 10000) {
        delay = minute * 10;
      }
      return delay;
    },
  });

  redisClient.on("error", (err) => {
    // ignore connection error
    if (err.errno !== -4078) {
      console.log(`Redis error: `, err);
    }
  });

  const app = express();

  // app.set(`trust proxy`, 1);

  // const publicPath = __prod__ ? `/public` : `public`;

  console.log({ cwd: process.cwd() });
  app.use(express.static(path.join(process.cwd(), `public`)));

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrfn
        secure: __prod__, // cookie only works in https
        domain: __prod__ ? process.env.DOMAIN : undefined,
      },
      saveUninitialized: false,
      secret: SESSION_SECRET,
      resave: false,
    }),
  );

  app.get(`/`, async (_, res) => {
    const { status } = redisClient;

    const connections = {
      redis: status === `connect` || status === `ready`,
      postgres: conn.isConnected,
    };

    const page = await getTemplate({
      filename: `home`,
      data: { connections },
    });

    res.send(page);
  });

  const port = parseInt(PORT);
  app.listen(port, () => {
    console.log(
      `== App is running. ${
        __prod__ ? `Listening on port ${port}` : `http://localhost:${port}`
      }. ==`,
    );
  });
};

main().catch((err) => {
  console.log(err);
});
