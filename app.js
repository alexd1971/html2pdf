const bodyParser = require('body-parser');
const config = require('./config.json');
const express = require('express');
const htmlPdf = require('html-pdf-chrome');
const pug = require('pug');

const app = express();
app.use(bodyParser.json());

const PUG = 'pug';
const HTML = 'html';
const URL = 'url';
const allowedDoctypes = [HTML, PUG, URL];

app.post('/', (req, res) => {

  if (!(req.body.doctype && allowedDoctypes.includes(req.body.doctype.toLowerCase()))) {
    return res.status(400).send('Unknown doctype');
  }
  if(!req.body.document) {
    return res.status(400).send('No document');
  }
  
  const options = {
    host: config.chrome.host,
    port: config.chrome.port,
  };
  if(req.body.printOptions) {
    options.printOptions = req.body.printOptions;
  }

  var doc;
  try {
    switch (req.body.doctype.toLowerCase()) {
      case HTML:
      case URL:
        doc = req.body.document;
        break;
      case PUG:
        doc = pug.renderFile('templates/' + req.body.document + '/index.pug', req.body.vars);
        break;
    }
    htmlPdf.create(doc, options).then((pdf) => {
      res.contentType('application/pdf');
      res.end(pdf.toBuffer(), 'binary');
    }).catch((e) => {
      res.status(500).send(e);
    });
  } catch (e) {
    if (e.name == 'SyntaxError') {
      return res.status(500).send('Syntax Error: ' + e.message);
    }
    if (e.code == 'ENOENT') {
      return res.status(500).send('File not found: ' + e.path);
    }
    return res.status(500).send(e);
  }
});

app.listen(7777, () => {
  console.log('Listening on port 7777');
});
