import connectRedis from "connect-redis";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { getTemplate } from "./utils";
require("dotenv-safe").config({
  allowEmptyValues: true,
});
import { createConnection } from "typeorm";

const main = async () => {
  const { DATABASE_URL, PORT, REDIS_URL, SESSION_SECRET } = process.env;
  const conn = await createConnection({
    type: "postgres",
    url: DATABASE_URL,
    ssl: true,
    logging: true,
    entities: [],
  });

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

  const publicPath = __prod__ ? `/public` : `public`;
  app.use(express.static(publicPath));

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
