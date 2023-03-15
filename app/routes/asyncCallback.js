const axios = require("axios");
const uuidv4 = require("uuid/v4");

module.exports = {
  callCallbackUrl: function(payload) {
    const urlToCall = payload["outputs"]["callbackUrl"];

    setTimeout(() => {
      axios.post(urlToCall, payload)
    }, 15000);
  },

  post: function(req, res) {
    let response = {};

    response["receiptId"] = uuidv4();

    response["inputs"] = {};
    response["inputs"]["headers"] = req.headers;
    response["inputs"]["body"] = req.body;

    let baseCallbackUrl = decodeURI(req.query["callbackUrl"]);
    response["inputs"]["callbackUrl"] = baseCallbackUrl;

    response["outputs"] = {};
    response["outputs"]["textOutput"] = req.body["textInput"];
    
    response["outputs"]["callbackUrl"] = baseCallbackUrl;

    response["status"] = {};
    response["status"]["status"] = req.body["payloadStatus"];

    if (req.hasOwnProperty("body") && 
        req["body"].hasOwnProperty("resultStatus") &&
        req["body"]["resultStatus"] !== '') 
        {
          response["outputs"]["actualResultStatus"] = req.body["resultStatus"];
          response["outputs"]["callbackUrl"] = baseCallbackUrl + '&status=' + req.body["resultStatus"];
    } else {
      response["outputs"]["actualResultStatus"] = null;
    }

    if (req.hasOwnProperty("body") &&
        req["body"].hasOwnProperty("errorMessage") &&
        req["body"]["errorMessage"] !== '')
        {
          response["error"] = req.body["errorMessage"];
    }

    if (req.hasOwnProperty("body") &&
        req["body"].hasOwnProperty("initialStatusCode") &&
        req["body"]["initialStatusCode"] !== null)
        {
          res.status(req["body"]["initialStatusCode"]).json(response);
    } else {
      res.status(202).json(response);
    }

    if (req.query["callbackUrl"] !== undefined) {
       const result = module.exports.callCallbackUrl(response);
    }
  }
}
