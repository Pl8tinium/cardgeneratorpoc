const express = require('express')
const request = require('request')
const cardCreator = require('./main.js');
const bodyParser = require('body-parser');

const app = express();
// app.use('/twittercards', express.static('img/cards'))

const jsonParser = bodyParser.json()
app.get('/nft/hen/*', jsonParser, async (req, res) => {
  res.send(await cardCreator.getCardHeader(req.originalUrl))
});

app.get('/twittercards/*', async (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.end(await cardCreator.createCard(req.originalUrl));
});

app.listen(3000, () => {});
