import express from "express";
import cardCreator from "./main";
import bodyParser from "body-parser";

const app = express();
// app.use('/twittercards', express.static('img/cards'))

const jsonParser = bodyParser.json();
app.get("/nft/hen/*", jsonParser, async (req, res) => {
  res.send(await cardCreator.getCardHeader(req.originalUrl));
});

app.get("/twittercards/*", async (req, res) => {
  try {
    res.setHeader("Content-Type", "image/png");
    res.end(await cardCreator.createCard(req.originalUrl));
  } catch (e) {
    console.log(e);
    res.status(500).send("Error");
  }
});

app.listen(process.env.PORT || 3000, () => {});
