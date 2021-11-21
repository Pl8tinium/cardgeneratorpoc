const express = require('express')
const request = require('request')
const cardCreator = require('./main.js');
const bodyParser = require('body-parser');

const app = express();
const jsonParser = bodyParser.json()

app.post('/', jsonParser, async (req, res) => {
  console.log(req.body)
  nftLocation = req.body.nftLocation
  res.send(await cardCreator.createCard(nftLocation))  
});

app.listen(3000, () => {});

// {
//   "nftLocation": "/nft/hen/<nft-id>",
// }

// eg.: /nft/hen/4524