import connectRedis from "connect-redis";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { getTemplate } from "./utils";
import path from "path";
require("dotenv-safe").config({
  allowEmptyValues: true,
});

const main = async () => {
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  const app = express();

  // app.set(`trust proxy`, 1);

  const publicPath = __prod__ ? `/public` : `public`;
  console.log({ publicPath });
  app.use(express.static(publicPath));

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
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
      secret: process.env.SESSION_SECRET,
      resave: false,
    }),
  );

  app.get(`/`, async (_, res) => {
    const { status } = redis;

    const connections = {
      redis: status === `connect` || status === `ready`,
      postgres: false,
    };

    const page = await getTemplate({
      filename: `home`,
      data: { connections },
    });

    res.send(page);
  });

  const port = parseInt(process.env.PORT);
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
