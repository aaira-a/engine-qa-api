const expect = require("chai").expect;
const sinon = require("sinon");

const { getSleep } = require("../../app/routes/sleep");

describe('GET /api/sleep route', () => {

  let clock = null;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  }); 

  it('should send OK after 75000 milliseconds', () => {
    const req = {};
    const res = {};

    res.send = sinon.spy();

    getSleep(req, res);
    expect(res.send.called).to.be.eql(false);

    clock.tick(70000);
    expect(res.send.called).to.eql(false);

    clock.tick(5000);
    expect(res.send.calledWith({"message": "OK"})).to.eql(true);
  });
});
