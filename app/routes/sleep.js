module.exports = {
  getSleep: function(req, res) {
    setTimeout(() => {
      res.send({"message": "OK"});
    }, 75000);
  }
}
