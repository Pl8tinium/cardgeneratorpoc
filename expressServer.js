const express = require('express')
const request = require('request')
const cardCreator = require('./main.js');
const bodyParser = require('body-parser');

const app = express();
const jsonParser = bodyParser.json()

app.post('/', jsonParser, async (req, res) => {
  console.log(req.body)
  await cardCreator.createCard(req.body)

  return res.send('Card created');
});

app.listen(3000, () => {});

//curl -d '{"user": "Wyclef Jean","title": "I\'ll be gone till november", "nft": "./img/nft.png", avatar: "./img/avatar.png"}' -H "Content-Type: application/json" http://localhost:3000/

// {
//   "user": "Wyclef Jean",
//   "title": "I'll be gone till november",
//   "nft": "./img/nft.png",
//   "avatar": "./img/avatar.png"
// }