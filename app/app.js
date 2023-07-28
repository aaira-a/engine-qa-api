const express = require("express");

const axios = require("axios");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fileType = require("file-type");
const fs = require("fs");
const jsonfile = require("jsonfile");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const path = require("path");

const app = express();

const asyncCallbackRoute = require("./routes/asyncCallback");
const sleepRoute = require("./routes/sleep");

const octetStreamParser = bodyParser.raw({type: 'application/octet-stream', limit: '5000mb'});
const plainTextParser = bodyParser.text();

app.use(express.json({limit: '5000mb'}));
app.use(express.urlencoded());

app.use((req, res, next) => {
  if (req.headers.hasOwnProperty("x-apigateway-event")) {
    delete req.headers["x-apigateway-event"];
  }
  next();
});

app.get("/api/hello", (req, res) => {
  res.json({
    "hello": "world"
  })
});

app.get('/api/docs/:requestPath', (req, res) => {
  let requestPath = req.params.requestPath;
  let file = path.join(__dirname + '/docs/' + requestPath);

  jsonfile.readFile(file, (err, obj) => {
    if(err) {
      res.status(404);
    } 
    if(
        (obj !== undefined) &&
        (obj.hasOwnProperty('host')) && 
        (obj.host == '##HOST_PLACEHOLDER##')) 
      {
        obj.host = process.env.API_HOST;
      }
    res.json(obj);
  });
});

app.all('/api/echo/:status?', (req, res) => {
  let response = {};

  response["echo-method"] = req.method;
  response["echo-headers"] = req.headers;
  response["echo-qs"] = req.query;
  response["echo-originalurl"] = req.headers["x-waws-unencoded-url"];

  if (req.headers.hasOwnProperty("content-type")) {
    response["echo-body-content-type"] = req.headers["content-type"]
  }

  if (req.hasOwnProperty("body")) {
    response["echo-body"] = req.body;
  }

  if (req.params.status !== undefined) {
    res.status(req.params.status).json(response);
  }

  setTimeout(() => {
    res.json(response);
  }, 60000);
  
})

app.all('/api/echo-from-text/:status?', plainTextParser, (req, res) => {
  let response = {};

  response["echo-method"] = req.method;
  response["echo-headers"] = req.headers;
  response["echo-qs"] = req.query;
  response["echo-body-text"] = req.body;

  function convertToJson(data){
    try {
      let parsed = JSON.parse(data);

      if (parsed instanceof Object) {
        return parsed;
      }
      else {
        return JSON.parse(parsed);
      }
    }
    catch(error) {
      return null;
    }
  }

  let parsed = convertToJson(req.body);

  response = {...parsed, ...response};

  if (req.params.status !== undefined) {
    res.status(req.params.status).json(response);
  }
  res.json(response);
})

app.get('/api/files/errors/:status', (req, res) => {
  res.status(req.params.status).send();
});

app.get('/api/files/download/base64', (req, res) => {
  const filepath = path.join(__dirname, 'files', 'publicdomain.png');
  const file = fs.readFileSync(filepath);

  const content = file.toString('base64');
  const hash = crypto.createHash('md5').update(file).digest("hex");

  res.set('Content-Disposition', 'attachment; filename="publicdomain.png"');

  let response = {
    "fileContent": content,
    "originalName": "publicdomain.png",
    "mimeType": "image/png",
    "md5": hash,
    "size": Buffer.byteLength(file)
  };

  res.json(response);
});

app.get('/api/files/download/base64/multi', (req, res) => {

  let response = {};
  response["files"] = [];

  filenames = ['publicdomain.png', 'creativecommons.png'];

  for (let i in filenames) {
    const filepath = path.join(__dirname, 'files', filenames[i]);
    const file = fs.readFileSync(filepath);

    const content = file.toString('base64');
    const hash = crypto.createHash('md5').update(file).digest("hex"); 

    const fileDetails = {
      "fileContent": content,
      "originalName": filenames[i],
      "mimeType": "image/png",
      "md5": hash,
      "size": Buffer.byteLength(file)
    };

    response["files"].push(fileDetails);
  }

  response["count"] = response["files"].length;

  res.json(response);
});

app.get('/api/files/download/base64/multi/flattened', (req, res) => {

  let response = {};
  response["files"] = [];
  response["metadata"] = []

  filenames = ['publicdomain.png', 'creativecommons.png'];

  for (let i in filenames) {
    const filepath = path.join(__dirname, 'files', filenames[i]);
    const file = fs.readFileSync(filepath);

    const content = file.toString('base64');
    const hash = crypto.createHash('md5').update(file).digest("hex"); 

    const fileDetails = {
      "originalName": filenames[i],
      "mimeType": "image/png",
      "md5": hash,
      "size": Buffer.byteLength(file)
    };
    response["files"].push(content);
    response["metadata"].push(fileDetails);
  }

  response["count"] = response["files"].length;

  res.json(response);
});

app.post('/api/files/upload/base64', async (req, res) => {

  const buffer = Buffer.from(req.body["fileContent"], 'base64');
  const mimeInfo = await fileType.fromBuffer(buffer);
  const hash = crypto.createHash('md5').update(buffer).digest("hex");

  let response = {
    "customName": req.body["customName"],
    "mimeType": mimeInfo["mime"],
    "md5": hash,
    "size": Buffer.byteLength(buffer, 'base64')
  };

  res.json(response);
});

app.post('/api/files/upload/base64/multi', async (req, res) => {

  let response = {};
  response["files"] = [];

  for (let i in req.body) {
    const buffer = Buffer.from(req.body[i]["fileContent"], 'base64');
    const mimeInfo = await fileType.fromBuffer(buffer);
    const hash = crypto.createHash('md5').update(buffer).digest("hex");

    const fileDetails = {
      "customName": req.body[i]["customName"],
      "mimeType": mimeInfo["mime"],
      "md5": hash,
      "size": Buffer.byteLength(buffer, 'base64')
    };

    response["files"].push(fileDetails);
  }

  response["count"] = response["files"].length;

  res.json(response);
});

app.post('/api/files/upload/form-data', upload.single('file1'), async (req, res) => {

  const buffer = Buffer.from(req.file.buffer, 'binary');
  const mimeInfo = await fileType.fromBuffer(buffer);
  const hash = crypto.createHash('md5').update(buffer).digest("hex");

  let response = {
    "originalName": req.file.originalname,
    "customName": req.body["customName"],
    "mimeType": mimeInfo["mime"],
    "md5": hash,
    "size": req.file.size
  };

  res.json(response);
});

app.post('/api/files/upload/form-data/multi', upload.any(), async (req, res) => {

  let response = {};
  response["files"] = [];

  const file1 = req.files[0]
  const buffer1 = Buffer.from(file1.buffer, 'binary');
  const mimeInfo1 = await fileType.fromBuffer(buffer1);
  const hash1 = crypto.createHash('md5').update(buffer1).digest("hex");

  let fileDetails1 = {
    "originalName": file1.originalname,
    "customName": req.body["customName1"],
    "mimeType": mimeInfo1["mime"],
    "md5": hash1,
    "size": file1.size
  };

  response["files"].push(fileDetails1);

  const file2 = req.files[1]
  const buffer2 = Buffer.from(file2.buffer, 'binary');
  const mimeInfo2 = await fileType.fromBuffer(buffer2);
  const hash2 = crypto.createHash('md5').update(buffer2).digest("hex");

  let fileDetails2 = {
    "originalName": file2.originalname,
    "customName": req.body["customName2"],
    "mimeType": mimeInfo2["mime"],
    "md5": hash2,
    "size": file2.size
  };

  response["files"].push(fileDetails2);

  response["count"] = response["files"].length;

  res.json(response);
});

app.get('/api/files/download/octet-stream', (req, res) => {
  const filepath = path.join(__dirname, 'files', 'publicdomain.png');
  const file = fs.readFileSync(filepath);

  res.set({
    "Content-Disposition": "attachment; filename=\"publicdomain.png\"",
    "originalName": "publicdomain.png",
    "mimeType": "image/png",
    "md5": "c9469b266705cf08cfa37f0cf834d11f",
    "size": "6592"
  });

  res.send(file);
});

app.post('/api/files/upload/octet-stream', octetStreamParser, async (req, res) => {

  const hash = crypto.createHash('md5').update(req.body).digest("hex");
  const mimeInfo = await fileType.fromBuffer(req.body)
    .then((result) => {

      let response = {
        "customName": req.headers["custom-name"],
        "mimeType": result["mime"],
        "md5": hash,
        "size": Buffer.byteLength(req.body)
      };

      res.json(response);

    });

});

app.get('/api/files/download/uri', (req, res) => {

  res.set('Content-Disposition', 'attachment; filename="publicdomain.png"');

  let response = {
    "uri": 'https://azamstatic.blob.core.windows.net/static/publicdomain.png',
    "originalName": "publicdomain.png",
    "mimeType": "image/png",
    "md5": 'c9469b266705cf08cfa37f0cf834d11f',
    "size": 6592
  };

  res.json(response);
});

app.get('/api/files/download/uri/multi', (req, res) => {

  let response = {
    "files": [
      {
        "uri": 'https://azamstatic.blob.core.windows.net/static/publicdomain.png',
        "originalName": "publicdomain.png",
        "mimeType": "image/png",
        "md5": 'c9469b266705cf08cfa37f0cf834d11f',
        "size": 6592
      },
      {
        "uri": 'https://azamstatic.blob.core.windows.net/static/creativecommons.png',
        "originalName": "creativecommons.png",
        "mimeType": "image/png",
        "md5": '64bb88afbfcfe03145d176001d413154',
        "size": 6413
      }
    ],
    "count": 2
  };

  res.json(response);
});

app.get('/api/files/download/uri/multi/flattened', (req, res) => {

  let response = {
    "files": [
      'https://azamstatic.blob.core.windows.net/static/publicdomain.png',
      'https://azamstatic.blob.core.windows.net/static/creativecommons.png'
    ],
    "metadata": [
      {
        "originalName": "publicdomain.png",
        "mimeType": "image/png",
        "md5": 'c9469b266705cf08cfa37f0cf834d11f',
        "size": 6592
      },
      {
        "originalName": "creativecommons.png",
        "mimeType": "image/png",
        "md5": '64bb88afbfcfe03145d176001d413154',
        "size": 6413
      }
    ],
    "count": 2
  };

  res.json(response);
});

app.post('/api/files/upload/uri', async (req, res) => {
  let sourceUri = req.body["fileUri"];

  axios({
    method: 'get',
    url: sourceUri,
    responseType: 'arraybuffer'
  })
  .then(async (downloaded) => {
    const buffer = Buffer.from(downloaded.data, 'base64');
    const mimeInfo = await fileType.fromBuffer(buffer);
    const hash = crypto.createHash('md5').update(buffer).digest("hex");

    let response = {
      "customName": req.body["customName"],
      "mimeType": mimeInfo["mime"],
      "md5": hash,
      "size": Buffer.byteLength(buffer, 'base64')
    };
    
    res.json(response);
  });

});

app.post('/api/files/upload/uri/multi', async (req, res) => {

  let response = {};
  response["files"] = [];

  for (let i in req.body) {

    const sourceUri = req.body[i]["fileUri"];

    await axios({
      method: 'get',
      url: sourceUri,
      responseType: 'arraybuffer'
    })
    .then(async (downloaded) => {
      const buffer = Buffer.from(downloaded.data, 'base64');
      const mimeInfo = await fileType.fromBuffer(buffer);
      const hash = crypto.createHash('md5').update(buffer).digest("hex");

      const fileDetails = {
        "customName": req.body[i]["customName"],
        "mimeType": mimeInfo["mime"],
        "md5": hash,
        "size": Buffer.byteLength(buffer, 'base64')
      };

      response["files"].push(fileDetails);
    });

  }

  response["count"] = response["files"].length;

  res.json(response);
});

app.post('/api/all-types', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body

  response["outputs"] = {};

  if (req.hasOwnProperty("body") && req["body"].hasOwnProperty("allTypesInputs")) {
    if (req.body["allTypesInputs"].hasOwnProperty("textInput")) {
      response["outputs"]["textOutput"] = req.body["allTypesInputs"]["textInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("decimalInput")) {
      response["outputs"]["decimalOutput"] = req.body["allTypesInputs"]["decimalInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("integerInput")) {
      response["outputs"]["integerOutput"] = req.body["allTypesInputs"]["integerInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("booleanInput")) {
      if (typeof req.body["allTypesInputs"]["booleanInput"] === 'boolean') {
        response["outputs"]["booleanOutput"] = req.body["allTypesInputs"]["booleanInput"];
      }
      else {
        response["outputs"]["booleanOutput"] = null;
      }
    }

    if (req.body["allTypesInputs"].hasOwnProperty("datetimeInput")) {
      response["outputs"]["datetimeOutput"] = req.body["allTypesInputs"]["datetimeInput"];
    }

    if (req.body["allTypesInputs"].hasOwnProperty("collectionInput")) {
      if (req.body["allTypesInputs"]["collectionInput"] instanceof Array) {
        response["outputs"]["collectionOutput"] = req.body["allTypesInputs"]["collectionInput"];
      }
      else {
        response["outputs"]["collectionOutput"] = null;
      }
    }
  }
  res.json(response);
});

app.get('/api/all-types/object', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;
  response["inputs"]["qs"] = req.query;

  response["outputs"] = {};


  response["outputs"]["object"] = {};

  hardcodedValid = {
      "text": "text1",
      "decimal": 123.546,
      "integer": 42,
      "boolean": true,
      "datetime": "2017-07-21T17:32:28Z",
      "collection": ["text2", -543.21, 24, true, "2020-12-31T17:56:57Z"],
      "object": {"key1": "value1", "key2": {"key3": "value3"}}
  };

  if (req.query.hasOwnProperty("expected")) {
    switch (req.query["expected"]) {
      case '':
        response["outputs"]["object"]["asObject"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
        break;
      case 'empty':
        response["outputs"]["object"]["asObject"] = {};
        response["outputs"]["object"]["asString"] = {};
        break;
      case 'plaintext':
        res.send(200, 'this is a plaintext');
      default:
        response["outputs"]["object"]["asObject"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
    }
  }
  else {
    response["outputs"]["object"]["asObject"] = hardcodedValid;
    response["outputs"]["object"]["asString"] = hardcodedValid;
  }

  res.json(response);
});

app.get('/api/all-types/array', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;
  response["inputs"]["qs"] = req.query;

  response["outputs"] = {};


  response["outputs"]["object"] = {};

  hardcodedValid = [
    "text1",
    123.546,
    42,
    true,
    "2017-07-21T17:32:28Z",
    {"key1": "value1", "key2": {"key3": "value3"}}
  ];

  if (req.query.hasOwnProperty("expected")) {
    switch (req.query["expected"]) {
      case '':
        response["outputs"]["object"]["asArray"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
        break;
      case 'empty':
        response["outputs"]["object"]["asArray"] = {};
        response["outputs"]["object"]["asString"] = {};
        break;
      case 'plaintext':
        res.send(200, 'this is a plaintext');
      default:
        response["outputs"]["object"]["asArray"] = hardcodedValid;
        response["outputs"]["object"]["asString"] = hardcodedValid;
    }
  }
  else {
    response["outputs"]["object"]["asArray"] = hardcodedValid;
    response["outputs"]["object"]["asString"] = hardcodedValid;
  }

  res.json(response);
});

app.post('/api/all-types-stringified', (req, res) => {
  let response = {};

  response["allTypesOutputsStringified"] = JSON.stringify(req.body);

  res.json(response);
});

app.post('/api/all-types-odata', (req, res) => {
  let response = {};

  response["allTypesOutputsStringified"] = req.query["odata"];

  res.json(response);
});

app.get('/api/all-types-nullable', (req, res) => {

  let response = {};

  let validValues = {
    "textOutput": "primitive text 1",
    "decimalOutput": 123456.789,
    "integerOutput": 111,
    "booleanOutput": true,
    "datetimeOutput": "2021-02-01T17:28:18.686Z",
    "textCollectionOutput": ["abc", "def", "ghi"],
    "decimalCollectionOutput": [1.1, 2.2, 3.3],
    "integerCollectionOutput": [4, 5, 6],
    "booleanCollectionOutput": [true, false, true],
    "datetimeCollectionOutput": [
      "2021-02-01T17:23:56.139Z",
      "2022-02-01T17:23:56.139Z",
      "2023-02-01T17:23:56.139Z",
    ],
    "ObjectCollectionOutput": [
      {
        "textOutput": "obj1",
        "decimalOutput": 7.7,
        "integerOutput": -1,
        "booleanOutput": true,
        "datetimeOutput": "2025-02-01T17:23:56.139Z"
      },
      {
        "textOutput": "obj2",
        "decimalOutput": 8.8,
        "integerOutput": -2,
        "booleanOutput": true,
        "datetimeOutput": "2026-02-01T17:23:56.139Z"
      }
    ]
  };

  let explicitNull = {
    "textOutput": null,
    "decimalOutput": null,
    "integerOutput": null,
    "booleanOutput": null,
    "datetimeOutput": null,
    "textCollectionOutput": null,
    "decimalCollectionOutput": null,
    "integerCollectionOutput": null,
    "booleanCollectionOutput": null,
    "datetimeCollectionOutput": null,
    "ObjectCollectionOutput": null
  };

  let missingProperty = {};

  if (req.query.hasOwnProperty("expected")) {
    switch (req.query["expected"]) {
      case '':
        response["outputs"] = validValues;
        break;
      case 'validValues':
        response["outputs"] = validValues;
        break;
      case 'explicitNull':
        response["outputs"] = explicitNull;
        break;
      case 'missingProperty':
        response["outputs"] = missingProperty;
        break;
      default:
        response["outputs"] = validValues;
    }
  }
  else {
    response["outputs"] = validValues;
  }

  res.json(response);
});

app.get('/api/file-nullable', (req, res) => {

  function generateFileDetails(fileName) {
    const filepath = path.join(__dirname, 'files', fileName);
    const file = fs.readFileSync(filepath);

    const content = file.toString('base64');
    const hash = crypto.createHash('md5').update(file).digest("hex");

    let fileDetails = {
      "fileContent": content,
      "originalName": fileName,
      "mimeType": "image/png",
      "md5": hash,
      "size": Buffer.byteLength(file)
    };

    return fileDetails;
  };

  let response = {};

  let validValues = {
    "fileOutput": generateFileDetails("CharA.png"),
    "fileCollectionOutput": [
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACySURBVEhL7ZPRDoAgCEW1//9nY+GYS5QL07VV5yVrdY8I5VJK2slRr9v4BSZKk3POdaXhHYqhYBTU6hGZLoC+nO5DiPcA2QTx2TGlBoCtcgs4mhbre9BGg+kENKaSy7cujAquTcfTCb2CuuoIaKAjYkTs0jiaTLkcPSmxxz2mrMEdboEAOoICPiuEeAUgDwnM88WbDP1o6jtgG+wfTXzykJ/EBSq3ssCvCFQQ5q1juoyUTo3XchvVQmDSAAAAAElFTkSuQmCC",
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACVSURBVEhL7ZXBDsAgCENl///PromeDKKRgsmyd9lO7VqRSa21RPL0Zxi/wZKtQxaR/qZhK6wNmvrxsC0qcqoDy8CvDqYGFHVgJfCrg/Ax1Q3QD+XzwY0E7XhZ6AlY/YD0irj9ACUBsR+QXhGd0QD9ZIwpEd2AGELfOYOBZ652f5ngzGZ3axql2Qq0tTzjexeNTrBBKS/XbjwlavjApAAAAABJRU5ErkJggg==",
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAC7SURBVFhH7ZfRCoAgDEW1///n6oIDsXRX3RDKA1EP5Y7XJRXPm7CQI52XsQXUHogxpqsnFu1DCdRuyeVGZaaWAEXlgEwrrRpmPZCL9GDehL1puLwFkACMRFMAA8hgvbDPuSQgMD3hKsDwD4HWMrgLaM34/SXQXmVXgemNyIJlPcDuoi4CTPSCWwLM7IGpAGbORi+YCUjsPcWBicBocWCWwEhx0PwqLtdTZloyWhyoAiUzxd7YP6eLBUK4ACJ7Yx0sF/V/AAAAAElFTkSuQmCC",
    ],
    "ObjectCollectionOutput": [
      {
        "fileOutput": generateFileDetails("CharE.png")
      },
      {
        "fileOutput": generateFileDetails("CharF.png")
      }
    ]
  };

  let explicitNull = {
    "fileOutput": null,
    "fileCollectionOutput": null,
    "ObjectCollectionOutput": null
  };

  let missingProperty = {};

  if (req.query.hasOwnProperty("expected")) {
    switch (req.query["expected"]) {
      case '':
        response["outputs"] = validValues;
        break;
      case 'validValues':
        response["outputs"] = validValues;
        break;
      case 'explicitNull':
        response["outputs"] = explicitNull;
        break;
      case 'missingProperty':
        response["outputs"] = missingProperty;
        break;
      default:
        response["outputs"] = validValues;
    }
  }
  else {
    response["outputs"] = validValues;
  }

  res.json(response);
});

app.post('/api/all-parameter-types/:string_path/:integer_path/:boolean_path', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["querystring"] = req.query;
  response["inputs"]["body"] = req.body;

  response["allParameterTypesOutput"] = {};
  response["allParameterTypesOutput"]["headers"] = {
    "string_header": req.headers["string_header"],
    "integer_header": req.headers["integer_header"],
    "boolean_header": req.headers["boolean_header"]
  }

  response["allParameterTypesOutput"]["path"] = {
    "string-path": req.params.string_path,
    "integer-path": req.params.integer_path,
    "boolean-path": req.params.boolean_path
  }

  response["allParameterTypesOutput"]["querystring"] = req.query;

  response["allParameterTypesOutput"]["body"] = req.body;  

  res.json(response);
});

app.post('/api/path-encoding/:text', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["originalUrl"] = req.originalUrl;
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;

  response["path"] = req.originalUrl.replace(/.*\/api\/path-encoding\//g, '');
  res.json(response);
});

app.post('/api/query-encoding', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["originalUrl"] = req.originalUrl;
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;

  response["query"] = req.headers["x-waws-unencoded-url"].replace(/.*\/api\/query-encoding\?string_query=/g, '');
  res.json(response);
});

app.post('/api/form-urlencoded/:string_path/parsed', (req, res) => {
  let response = {};

  response["inputs"] = {};
  response["inputs"]["originalUrl"] = req.originalUrl;
  response["inputs"]["headers"] = req.headers;
  response["inputs"]["body"] = req.body;

  if (req.headers.hasOwnProperty("content-type") 
      && req.headers["content-type"] === 'application/x-www-form-urlencoded') {
        response["inputs"]["x-www-form-urlencoded"] = true;
  }
  else {
    response["inputs"]["x-www-form-urlencoded"] = false;
  }

  response["outputs"] = {};
  response["outputs"]["textPathOutput"] = req.params.string_path;
  response["outputs"]["textOutput"] = req.body.string;
  response["outputs"]["decimalOutput"] = parseFloat(req.body.decimal);
  response["outputs"]["integerOutput"] = parseInt(req.body.integer);

  if (req.body.boolean === 'true') {
    response["outputs"]["booleanOutput"] = true;
  }

  else if (req.body.boolean === 'false') {
    response["outputs"]["booleanOutput"] = false;
  }

  else {
    response["outputs"]["booleanOutput"] = 'error'
  }

  response["outputs"]["datetimeOutput"] = req.body.datetime;


  res.json(response);
});

app.post('/api/async-callback', asyncCallbackRoute.post);

app.use('/api/sleep', sleepRoute.getSleep);

app.get('/api/data/array/integer', (req, res) => {
  let count = parseInt(req.query.elements);

  let elements = [...Array(count+1).keys()]
  elements.shift();

  res.json(elements);
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    let response = {};
    response['error'] = err;
    res.status(400).json(response);
  } else {
    next();
  }
});

module.exports = app;
