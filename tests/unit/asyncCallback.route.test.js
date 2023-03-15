const expect = require("chai").expect;
const sinon = require("sinon");

const axios = require("axios");

const asyncCallback = require("../../app/routes/asyncCallback");

describe('POST /api/async-callback route', () => {

  let clock = null;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  }); 

  it('callCallback function should call url after 15000 milliseconds', () => {
    axios.post = sinon.spy();
    const payload = {"outputs": {"callbackUrl": "myurl"}};

    asyncCallback.callCallbackUrl(payload);
    expect(axios.post.called).to.be.eql(false);

    clock.tick(10000);
    expect(axios.post.called).to.eql(false);

    clock.tick(5000);
    expect(axios.post.calledWith("myurl", payload)).to.eql(true);
  });

  it('post function should call callCallback with callbackUrl in json response', () => {
    asyncCallback.callCallbackUrl = sinon.spy();

    let req = {
      query: { "callbackUrl": "myCallbackUrl"},
      headers: {"h1": "v1"},
      body: {
        "textInput": "abc",
        "resultStatus": "",
        "errorMessage": ""
      }
    };

    let res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    asyncCallback.post(req, res);

    const payload = res.json.getCall(0).args[0];
    expect(asyncCallback.callCallbackUrl.calledWith(payload)).to.eql(true);
  });
});
