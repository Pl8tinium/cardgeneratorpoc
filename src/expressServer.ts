const express = require("express");
const request = require("request");
const cardCreator = require("./main.js");
const bodyParser = require("body-parser");

const app = express();
// app.use('/twittercards', express.static('img/cards'))

const jsonParser = bodyParser.json();
app.get(
  "/nft/hen/*",
  jsonParser,
  async (req: { originalUrl: any }, res: { send: (arg0: any) => void }) => {
    res.send(await cardCreator.getCardHeader(req.originalUrl));
  }
);

app.get(
  "/twittercards/*",
  async (
    req: { originalUrl: any },
    res: {
      setHeader: (arg0: string, arg1: string) => void;
      end: (arg0: any) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): void; new (): any };
      };
    }
  ) => {
    try {
      res.setHeader("Content-Type", "image/png");
      res.end(await cardCreator.createCard(req.originalUrl));
    } catch (e) {
      console.log(e);
      res.status(500).send("Error");
    }
  }
);

app.listen(process.env.PORT || 3000, () => {});
