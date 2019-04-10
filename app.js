const bodyParser = require('body-parser');
const config = require('./config.json');
const express = require('express');
const htmlPdf = require('html-pdf-chrome');
const pug = require('pug');

const app = express();
app.use(bodyParser.json());
app.post('/', (req, res) => {

  const options = {
    host: config.chrome.host,
    port: config.chrome.port,
  };

  if(req.body.printOptions) {
    options.printOptions = req.body.printOptions;
  }
  if(!req.body.document) {
    return res.status(400).send('No document');
  }
  if(!req.body.vars) {
    return res.status(400).send('No template vars');
  }
  var html;
  try {
    html = pug.renderFile('templates/' + req.body.document + '/index.pug', req.body.vars);
    htmlPdf.create(html, options).then((pdf) => {
      res.contentType('application/pdf');
      res.end(pdf.toBuffer(), 'binary');
    }).catch((e) => {
      res.status(500).send(e);
    });
  } catch(e) {
    if (e.code == 'ENOENT') {
      return res.status(500).send('File not found: ' + e.path);
    }
    return res.status(500).send(e);
  }
});

app.listen(7777, () => {
  console.log('Listening on port 7777');
});
