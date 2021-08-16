import "dotenv-safe/config";
import express from "express";

const main = async () => {
  const app = express();

  // app.set(`trust proxy`, 1);

  app.get(`/`, (_, res) => {
    res.send(`<h1>Docker Compose Example<h1/>`);
  });

  const port = parseInt(process.env.PORT);
  app.listen(port, () => {
    console.log(`== App is running. Listening on port ${port}. ==`);
  });
};

main().catch((err) => {
  console.log(err);
});
