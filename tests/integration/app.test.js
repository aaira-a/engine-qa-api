const assert = require("assert");
const expect = require("chai").expect;
const request = require("supertest");
const validator = require("validator");
const app = require("../../app/app");

describe('GET /api/hello', () => {

  it('should return 200 status', () => {
    return request(app)
      .get('/api/hello')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/hello')
      .then((response) => {
        expect(response.body).to.eql({"hello": "world"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

});

describe('GET /api/docs/', () => {

  it('should return 200 status for existing file', () => {
    return request(app)
      .get('/api/docs/swagger.json')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return 404 status for non-existing file', () => {
    return request(app)
      .get('/api/docs/doesnexist.json')
      .then((response) => {
        expect(response.status).to.eql(404)
      })
  });

});

describe('ALL /api/echo/:status?', () => {

  it('should return 200 status', () => {
    return request(app)
      .get('/api/echo')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return request headers in echo-headers object, downcased keys', () => {
    return request(app)
      .get('/api/echo')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['echo-headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['echo-headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/echo')
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

  it('should return query strings in echo-qs object', () => {
    return request(app)
      .get('/api/echo?abc=def&ghi=jkl')
      .then((response) => {
        expect(response.body['echo-qs']['abc']).to.eql('def');
        expect(response.body['echo-qs']['ghi']).to.eql('jkl');
      })
  });

  it('should return orignal url in echo-originalurl property', () => {
    return request(app)
      .get('/api/echo?abc=def&ghi=jkl')
      .set('x-waws-unencoded-url', '/api/echo?abc=def&ghi=jkl')
      .then((response) => {
        expect(response.body['echo-originalurl']).to.eql('/api/echo?abc=def&ghi=jkl');
      })
  });

  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].forEach((method) => {
    it('should return ' + method + ' method in echo-method key', () => {
      return request(app)
        [method.toLowerCase()]('/api/echo')
        .then((response) => {
          expect(response.body['echo-method']).to.eql(method);
        })
    });
  });

  it('should return json request body in echo-body object', () => {
    return request(app)
      .post('/api/echo')
      .set('Content-Type', 'application/json')
      .send({'key1': 'value1', 'key2': 'value2'})
      .then((response) => {
        expect(response.body['echo-body-content-type']).to.include('application/json');
        expect(response.body['echo-body']).to.eql({'key1': 'value1', 'key2': 'value2'});
      })
  });

  it('should return 400 status for malformed json request body', () => {
    return request(app)
      .post('/api/echo')
      .set('Content-Type', 'application/json')
      .send('{"key1":}')
      .then((response) => {
        expect(response.body['error']['body']).to.eql('{\"key1\":}');
      })
  });

  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' + status + ' status if supplied in route parameter', () => {
      return request(app)
        .post('/api/echo/' + status.toString())
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });
});

describe('ALL /api/echo-from-text/:status?', () => {

  it('should return 200 status', () => {
    return request(app)
      .get('/api/echo-from-text')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return request headers in echo-headers object, downcased keys', () => {
    return request(app)
      .get('/api/echo-from-text')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['echo-headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['echo-headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/echo-from-text')
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

  it('should return query strings in echo-qs object', () => {
    return request(app)
      .get('/api/echo-from-text?abc=def&ghi=jkl')
      .then((response) => {
        expect(response.body['echo-qs']['abc']).to.eql('def');
        expect(response.body['echo-qs']['ghi']).to.eql('jkl');
      })
  });

  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].forEach((method) => {
    it('should return ' + method + ' method in echo-method key', () => {
      return request(app)
        [method.toLowerCase()]('/api/echo-from-text')
        .then((response) => {
          expect(response.body['echo-method']).to.eql(method);
        })
    });
  });

  it('should return text request body in echo-body-text property', () => {
    return request(app)
      .post('/api/echo-from-text')
      .set('Content-Type', 'text/plain')
      .send('this is a text')
      .then((response) => {
        expect(response.body['echo-body-text']).to.eql('this is a text');
      })
  });

  it('should convert text request body to json and return in body', () => {
    return request(app)
      .post('/api/echo-from-text')
      .set('Content-Type', 'text/plain')
      .send('{"key1": "value1", "key2": "value2"}')
      .then((response) => {
        expect(response.body).to.include({'key1': 'value1', 'key2': 'value2'});
      })
  });

  it('should convert escaped text request body to json and return in body', () => {
    return request(app)
      .post('/api/echo-from-text')
      .set('Content-Type', 'text/plain')
      .send("\"{\\\"abc\\\": true, \\\"def\\\": 123, \\\"message\\\": \\\"message1\\\"}\"")
      .then((response) => {
        expect(response.body).to.include({'abc': true, 'def': 123, 'message': 'message1'});
      })
  });

  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' + status + ' status if supplied in route parameter', () => {
      return request(app)
        .post('/api/echo-from-text/' + status.toString())
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });
});

describe('GET /api/files/errors/:status', () => {
  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' + status + ' status supplied in route parameter', () => {
      return request(app)
        .get('/api/files/errors/' + status.toString())
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });
});

describe('POST /api/all-types', () => {

  it('should return request headers in inputs object, downcased keys', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['inputs']['headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['inputs']['headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return request body in outputs object', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'any': {'key1': 'value1'}})
      .then((response) => {
        expect(response.body['inputs']['body']).to.eql({'any': {'key1': 'value1'}});
      })
  });

  it('should return json response', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });  

  it('should return text output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'textInput': 'abc'}})
      .then((response) => {
        expect(response.body['outputs']['textOutput']).to.eql('abc')
      })
  });

  it('should return empty string for empty text input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'textInput': ''}})
      .then((response) => {
        expect(response.body['outputs']['textOutput']).to.eql('')
      })
  });

  it('should return null for null text input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'textInput': null}})
      .then((response) => {
        expect(response.body['outputs']['textOutput']).to.eql(null)
      })
  });

  it('should return decimal output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'decimalInput': 123.45}})
      .then((response) => {
        expect(response.body['outputs']['decimalOutput']).to.eql(123.45)
      })
  });

  it('should not add decimal points for round decimal input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'decimalInput': 42}})
      .then((response) => {
        expect(response.body['outputs']['decimalOutput']).to.eql(42)
      })
  });

  it('should return null for null decimal input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'decimalInput': null}})
      .then((response) => {
        expect(response.body['outputs']['decimalOutput']).to.eql(null)
      })
  });

  it('should return integer output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'integerInput': -789}})
      .then((response) => {
        expect(response.body['outputs']['integerOutput']).to.eql(-789)
      })
  });

  it('should preserve decimals if sent for integer input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'integerInput': 67.89}})
      .then((response) => {
        expect(response.body['outputs']['integerOutput']).to.eql(67.89)
      })
  });

  it('should return null for null integer input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'integerInput': null}})
      .then((response) => {
        expect(response.body['outputs']['integerOutput']).to.eql(null)
      })
  });

  it('should return true boolean output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': true}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(true)
      })
  });

  it('should return false boolean output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': false}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(false)
      })
  });

  it('should return null for null boolean input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': null}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(null)
      })
  });

  it('should return null for incorrect boolean input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'booleanInput': 'true'}})
      .then((response) => {
        expect(response.body['outputs']['booleanOutput']).to.eql(null)
      })
  });

  it('should return datetime output with ISO 8601 Z format', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'datetimeInput': '2017-07-21T17:32:28Z'}})
      .then((response) => {
        expect(response.body['outputs']['datetimeOutput']).to.eql('2017-07-21T17:32:28Z')
      })
  });

  it('should return datetime output with ISO 8601 and time offset format', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'datetimeInput': '2017-07-21T17:32:28+0800'}})
      .then((response) => {
        expect(response.body['outputs']['datetimeOutput']).to.eql('2017-07-21T17:32:28+0800')
      })
  });

  it('should return null for null datetime input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'datetimeInput': null}})
      .then((response) => {
        expect(response.body['outputs']['datetimeOutput']).to.eql(null)
      })
  });

  it('should return collection output', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'collectionInput': ['abc', 'def', 'ghi']}})
      .then((response) => {
        expect(response.body['outputs']['collectionOutput']).to.eql(['abc', 'def', 'ghi'])
      })
  });

  it('should return empty collection for empty collection input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'collectionInput': []}})
      .then((response) => {
        expect(response.body['outputs']['collectionOutput']).to.eql([])
      })
  });

  it('should return null for non-collection input', () => {
    return request(app)
      .post('/api/all-types')
      .set('Content-Type', 'application/json')
      .send({'allTypesInputs': {'collectionInput': 'abc'}})
      .then((response) => {
        expect(response.body['outputs']['collectionOutput']).to.eql(null)
      })
  });
});

describe('GET /api/all-types/object', () => {

  beforeEach(() => {
    this.hardcoded = {
      "text": "text1",
      "decimal": 123.546,
      "integer": 42,
      "boolean": true,
      "datetime": "2017-07-21T17:32:28Z",
      "collection": ["text2", -543.21, 24, true, "2020-12-31T17:56:57Z"],
      "object": {"key1": "value1", "key2": {"key3": "value3"}}
    };
  });

  it('should return request headers in inputs object, downcased keys', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['inputs']['headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['inputs']['headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });  

  it('should return hardcoded body in asObject', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString', () => {
    return request(app)
      .get('/api/all-types/object')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asObject if querystring is body', () => {
    return request(app)
      .get('/api/all-types/object?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is body', () => {
    return request(app)
      .get('/api/all-types/object?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return empty object in asObject if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/object?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql({});
      })
  });

  it('should return empty object in asString if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/object?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql({});
      })
  });

  it('should return hardcoded body in asObject if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/object?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/object?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded plaintext if requested in querystring', () => {
      return request(app)
      .get('/api/all-types/object?expected=plaintext')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.text).to.eql('this is a plaintext');
      })
  });

  it('should return hardcoded body in asObject if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/object?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asObject']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/object?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });
});

describe('GET /api/all-types/array', () => {

  beforeEach(() => {
    this.hardcoded = [
      "text1",
      123.546,
      42,
      true,
      "2017-07-21T17:32:28Z",
      {"key1": "value1", "key2": {"key3": "value3"}}
    ];
  });

  it('should return request headers in inputs object, downcased keys', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .set('Custom-Echo-Header', 'Random-Value-123')
      .set('Another-Echo-Header', 'My value 456')
      .then((response) => {
        expect(response.body['inputs']['headers']['custom-echo-header']).to.eql('Random-Value-123');
        expect(response.body['inputs']['headers']['another-echo-header']).to.eql('My value 456');
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      })
  });  

  it('should return hardcoded body in asArray', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString', () => {
    return request(app)
      .get('/api/all-types/array')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asArray if querystring is body', () => {
    return request(app)
      .get('/api/all-types/array?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is body', () => {
    return request(app)
      .get('/api/all-types/array?expected=body')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return empty object in asArray if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/array?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql({});
      })
  });

  it('should return empty object in asString if querystring is literal "empty"', () => {
    return request(app)
      .get('/api/all-types/array?expected=empty')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql({});
      })
  });

  it('should return hardcoded body in asArray if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/array?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring is "" empty string', () => {
    return request(app)
      .get('/api/all-types/array?expected=')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded plaintext if requested in querystring', () => {
      return request(app)
      .get('/api/all-types/array?expected=plaintext')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.text).to.eql('this is a plaintext');
      })
  });

  it('should return hardcoded body in asArray if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/array?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asArray']).to.eql(this.hardcoded);
      })
  });

  it('should return hardcoded body in asString if querystring not matching', () => {
    return request(app)
      .get('/api/all-types/array?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['outputs']['object']['asString']).to.eql(this.hardcoded);
      })
  });
});

describe('POST /api/all-types-stringified', () => {

  it('should return valid json request body as string', () => {
    return request(app)
      .post('/api/all-types-stringified')
      .set('Content-Type', 'application/json')
      .send({'any': {'key1': 'value1'}})
      .then((response) => {
        expect(response.body['allTypesOutputsStringified']).to.eql('{"any":{"key1":"value1"}}');
      })
  });

  it('should return json request body with null property as string', () => {
    return request(app)
      .post('/api/all-types-stringified')
      .set('Content-Type', 'application/json')
      .send({'key1': null})
      .then((response) => {
        expect(response.body['allTypesOutputsStringified']).to.eql('{"key1":null}');
      })
  });

  it('should return empty request body as string', () => {
    return request(app)
      .post('/api/all-types-stringified')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.body['allTypesOutputsStringified']).to.eql('{}');
      })
  });
});

describe('POST /api/all-types-odata', () => {

  it('should return odata querystring as string', () => {
    return request(app)
      .post("/api/all-types-odata?odata=substringof('needle', haystack) and dec gt 0.001 and bool eq true")
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['allTypesOutputsStringified']).to.eql("substringof('needle', haystack) and dec gt 0.001 and bool eq true");
      })
  });

  it('should return unmodified urlencoded odata querystring as string', () => {
    return request(app)
      .post("/api/all-types-odata?odata=substringof(%27needle%27%2Chaystack)%20and%20deci%20gt%0.001and%20bool%20eq%20true")
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.body['allTypesOutputsStringified']).to.eql("substringof(%27needle%27%2Chaystack)%20and%20deci%20gt%0.001and%20bool%20eq%20true");
      })
  });

  it('should return odata querystring with explicit null as string', () => {
    return request(app)
      .post('/api/all-types-odata?odata=decimal gt null and integer ge null and boolean eq null')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.body['allTypesOutputsStringified']).to.eql('decimal gt null and integer ge null and boolean eq null');
      })
  });

  it('should return empty odata querystring as string', () => {
    return request(app)
      .post('/api/all-types-odata?odata=')
      .set('Content-Type', 'application/json')
      .send({'key1': null})
      .then((response) => {
        expect(response.body['allTypesOutputsStringified']).to.eql('');
      })
  });

});


describe('GET /api/all-types-nullable', () => {

  beforeEach(() => {
    this.validValues = {
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

    this.explicitNull = {
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

    this.missingProperty = {};
  });

  it('should return hardcoded validValues json response by default', () => {
    return request(app)
      .get('/api/all-types-nullable')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });  

  it('should return hardcoded validValues json response if querystring is validValues', () => {
    return request(app)
      .get('/api/all-types-nullable?expected=validValues')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });  

  it('should return hardcoded validValues json response if querystring is empty string', () => {
    return request(app)
      .get('/api/all-types-nullable?expected=')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });

  it('should return hardcoded validValues json response if querystring not matching', () => {
    return request(app)
      .get('/api/all-types-nullable?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });  

  it('should return hardcoded explicitNull json response if querystring is explicitNull', () => {
    return request(app)
      .get('/api/all-types-nullable?expected=explicitNull')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.explicitNull);
      })
  });  

  it('should return hardcoded empty object json response if querystring is missingProperty', () => {
    return request(app)
      .get('/api/all-types-nullable?expected=missingProperty')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.missingProperty);
      })
  });  

});

describe('GET /api/file-nullable', () => {

  beforeEach(() => {
    this.validValues = {
      "fileOutput": {
          "fileContent": "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACESURBVEhL7Y5BCsAwCATz/0+nYpZSkLoaTOnBOaRKNzsZ8zAtoLSAkhaMkbuSTCtYYiTSq13AHiMnuM84O4KUIxp9ltYL9NGHBZgU1UUdOwKhXmDBPwbP2a4lELC7kJDT8oUg4vAStKJAgOkFfQDL4GuIXBZozBNgYvxVUEULKC0gzHkBuvRcP4Oq7bUAAAAASUVORK5CYII=",
          "originalName": "CharA.png",
          "mimeType": "image/png",
          "md5": "8ccae3f262fbd8747735395a556229f7",
          "size": 239
      },
        "fileCollectionOutput": [
          "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACySURBVEhL7ZPRDoAgCEW1//9nY+GYS5QL07VV5yVrdY8I5VJK2slRr9v4BSZKk3POdaXhHYqhYBTU6hGZLoC+nO5DiPcA2QTx2TGlBoCtcgs4mhbre9BGg+kENKaSy7cujAquTcfTCb2CuuoIaKAjYkTs0jiaTLkcPSmxxz2mrMEdboEAOoICPiuEeAUgDwnM88WbDP1o6jtgG+wfTXzykJ/EBSq3ssCvCFQQ5q1juoyUTo3XchvVQmDSAAAAAElFTkSuQmCC",
          "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACVSURBVEhL7ZXBDsAgCENl///PromeDKKRgsmyd9lO7VqRSa21RPL0Zxi/wZKtQxaR/qZhK6wNmvrxsC0qcqoDy8CvDqYGFHVgJfCrg/Ax1Q3QD+XzwY0E7XhZ6AlY/YD0irj9ACUBsR+QXhGd0QD9ZIwpEd2AGELfOYOBZ652f5ngzGZ3axql2Qq0tTzjexeNTrBBKS/XbjwlavjApAAAAABJRU5ErkJggg==",
          "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAC7SURBVFhH7ZfRCoAgDEW1///n6oIDsXRX3RDKA1EP5Y7XJRXPm7CQI52XsQXUHogxpqsnFu1DCdRuyeVGZaaWAEXlgEwrrRpmPZCL9GDehL1puLwFkACMRFMAA8hgvbDPuSQgMD3hKsDwD4HWMrgLaM34/SXQXmVXgemNyIJlPcDuoi4CTPSCWwLM7IGpAGbORi+YCUjsPcWBicBocWCWwEhx0PwqLtdTZloyWhyoAiUzxd7YP6eLBUK4ACJ7Yx0sF/V/AAAAAElFTkSuQmCC",
      ],
      "ObjectCollectionOutput": [
        {
          "fileOutput": {
              "fileContent": "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAACZSURBVFhH7ZbdCoAwCEZn7//OlTAhqum3H1kjz826cO6AP0T7SZrIls9phADcA0SUv570tFGVwFuoJsZY6SGB0uMjiCb8voBn/ZkoQQiYi8hrBQuQQCnEWsOC9kSXAIJ1370HLPk1pgCtdQumQE/9EdYogSchYArIBNROAscjd+C/YkZLeE0jcUjqKgGNuxyadphAK3+fgpQO3X9VGPJG2gMAAAAASUVORK5CYII=",
              "originalName": "CharE.png",
              "mimeType": "image/png",
              "md5": "66da72ec3afafceb2a9caa73c8cacc8a",
              "size": 260
          }
        },
        {
          "fileOutput": {
              "fileContent": "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAB5SURBVFhH7dTRCoAgDIXhrfd/50o0kGHNsckMzn9TF1If6OTzjhI72jMtANIB6iFk5vZWiz6zU4B+STTIDJBJUGkEfvvGJ0D7+SgNJAsHWMMYAgCA+SqWecd0yU34NINzA7zhEO4PKPuvTYInbAEA/wDgJlxZMoDoAgqtURHjBSxIAAAAAElFTkSuQmCC",
              "originalName": "CharF.png",
              "mimeType": "image/png",
              "md5": "add944ee2cd04a8af5d1bc6c54a2e9b3",
              "size": 228
          }
        }
      ]
    };

    this.explicitNull = {
      "fileOutput": null,
      "fileCollectionOutput": null,
      "ObjectCollectionOutput": null
    };

    this.missingProperty = {};
  });

  it('should return hardcoded validValues json response by default', () => {
    return request(app)
      .get('/api/file-nullable')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });  

  it('should return hardcoded validValues json response if querystring is validValues', () => {
    return request(app)
      .get('/api/file-nullable?expected=validValues')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });  

  it('should return hardcoded validValues json response if querystring is empty string', () => {
    return request(app)
      .get('/api/file-nullable?expected=')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });

  it('should return hardcoded validValues json response if querystring not matching', () => {
    return request(app)
      .get('/api/file-nullable?expected=doesntexist')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.validValues);
      })
  });  

  it('should return hardcoded explicitNull json response if querystring is explicitNull', () => {
    return request(app)
      .get('/api/file-nullable?expected=explicitNull')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.explicitNull);
      })
  });  

  it('should return hardcoded empty object json response if querystring is missingProperty', () => {
    return request(app)
      .get('/api/file-nullable?expected=missingProperty')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body['outputs']).to.eql(this.missingProperty);
      })
  });  

});

describe('POST /api/all-parameter-types/:string_path/:integer_path/:boolean_path', () => {
  
  it('should return all parameters in output', () => {
    return request(app)
      .post('/api/all-parameter-types/something/777/true?string_query=mystringquery&integer_query=666&boolean_query=true')
      .set('Content-Type', 'application/json')
      .set('string_header', 'this is a string header')
      .set('integer_header', '555')
      .set('boolean_header', 'true')
      .send({'string_body': 'this is a string property'})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['allParameterTypesOutput']["querystring"])
          .to.eql({'string_query': 'mystringquery', 'integer_query': '666', 'boolean_query': 'true'});
        expect(response.body['allParameterTypesOutput']["headers"]["string_header"])
          .to.eql('this is a string header');
        expect(response.body['allParameterTypesOutput']["headers"]["integer_header"])
          .to.eql('555');
        expect(response.body['allParameterTypesOutput']["headers"]["boolean_header"])
          .to.eql('true');
        expect(response.body['allParameterTypesOutput']["path"]["string-path"])
          .to.eql('something');
        expect(response.body['allParameterTypesOutput']["path"]["integer-path"])
          .to.eql('777');
        expect(response.body['allParameterTypesOutput']["path"]["boolean-path"])
          .to.eql('true');
        expect(response.body['allParameterTypesOutput']['body']['string_body'])
          .to.eql('this is a string property');
      })
  });
});

describe('POST /api/path-encoding/:text', () => {
  
  it('should return spaces encoded as %20', () => {
    return request(app)
      .post('/api/path-encoding/text%20with%20spaces')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['path']).to.eql('text%20with%20spaces')
      })
  });

  it('should return spaces encoded as +', () => {
    return request(app)
      .post('/api/path-encoding/text+with+spaces')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['path']).to.eql('text+with+spaces')
      })
  });

  it('should return encoded special characters', () => {
    return request(app)
      .post("/api/path-encoding/%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20")
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['path']).to.eql('%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20')
      })
  });

});

describe('POST /api/query-encoding', () => {
  
  it('should return spaces encoded as %20', () => {
    return request(app)
      .post('/api/query-encoding?string_query=text%20with%20spaces')
      .set('Content-Type', 'application/json')
      .set('x-waws-unencoded-url', '/api/query-encoding?string_query=text%20with%20spaces')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['query']).to.eql('text%20with%20spaces')
      })
  });

  it('should return spaces encoded as +', () => {
    return request(app)
      .post('/api/query-encoding?string_query=text+with+spaces')
      .set('Content-Type', 'application/json')
      .set('x-waws-unencoded-url', '/api/query-encoding?string_query=text+with+spaces')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['query']).to.eql('text+with+spaces')
      })
  });

  it('should return encoded special characters', () => {
    return request(app)
      .post("/api/query-encoding?string_query=%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20")
      .set('Content-Type', 'application/json')
      .set('x-waws-unencoded-url', "/api/query-encoding?string_query=%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20")
      .send({})
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['query']).to.eql('%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%25%20')
      })
  });

});

describe('POST /api/form-urlencoded/', () => {

  it('should return true for urlencoded content type', () => {
    return request(app)
      .post('/api/form-urlencoded/mytext/parsed')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send()
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['inputs']['x-www-form-urlencoded']).to.eql(true);
      })
  });

  it('should return false for application/json content type', () => {
    return request(app)
      .post('/api/form-urlencoded/mytext/parsed')
      .set('Content-Type', 'application/json')
      .send()
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['inputs']['x-www-form-urlencoded']).to.eql(false);
      })
  });

  it('should return parsed data', () => {
    return request(app)
      .post('/api/form-urlencoded/mytext/parsed')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('string=abc&decimal=0.1&integer=23&boolean=true&datetime=2017-12-23T12:34:56Z')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.body['outputs']['textPathOutput']).to.eql('mytext');
        expect(response.body['outputs']['textOutput']).to.eql('abc');
        expect(response.body['outputs']['decimalOutput']).to.eql(0.1);
        expect(response.body['outputs']['integerOutput']).to.eql(23);
        expect(response.body['outputs']['booleanOutput']).to.eql(true);
        expect(response.body['outputs']['datetimeOutput']).to.eql('2017-12-23T12:34:56Z');
      })
  });

})

describe('POST /api/async-callback', () => {

  it('should return 202 if initialStatusCode parameter is absent', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(202);
      })
  });

  it('should return 202 if initialStatusCode parameter is null', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'initialStatusCode': null})
      .then((response) => {
        expect(response.status).to.eql(202);
      })
  });

  [200, 400, 401, 403, 404, 405, 410, 500, 502, 503, 504].forEach((status) => {
    it('should return ' +  status + ' if supplied in initialStatusCode parameter ', () => {
      return request(app)
        .post('/api/async-callback')
        .set('Content-Type', 'application/json')
        .send({'initialStatusCode': status})
        .then((response) => {
          expect(response.status).to.eql(status);
        })
    });
  });

  it('should return random uuid as receipt id', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(validator.isUUID(response.body['receiptId'])).to.eql(true)
      })
  });

  it('should return input callbackUrl', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=something')
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['inputs']['callbackUrl']).to.eql('something')
      })
  });

  it('should return urldecoded output callbackUrl without status', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=https%3A%2F%2Fsub.domain.tld%2Fpath1%2Fpath2%2Foperation%3Fqs%3Dabc')
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['callbackUrl']).to.eql('https://sub.domain.tld/path1/path2/operation?qs=abc')
      })
  });

  it('should return urldecoded output callbackUrl with status', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=https%3A%2F%2Fsub.domain.tld%2Fpath1%2Fpath2%2Foperation%3Fqs%3Dabc')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': 'mystatus'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['callbackUrl']).to.eql('https://sub.domain.tld/path1/path2/operation?qs=abc&status=mystatus')
      })
  });

  it('should return urldecoded output callbackUrl without status if status is empty string', () => {
    return request(app)
      .post('/api/async-callback?callbackUrl=https%3A%2F%2Fsub.domain.tld%2Fpath1%2Fpath2%2Foperation%3Fqs%3Dabc')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': ''})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['callbackUrl']).to.eql('https://sub.domain.tld/path1/path2/operation?qs=abc')
      })
  });

  it('should return text output', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'textInput': 'xyz'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['textOutput']).to.eql('xyz')
      })
  });

  it('should return status as payload', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'payloadStatus': 'efg'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['status']['status']).to.eql('efg')
      })
  });

  it('should return result status if supplied in request', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': 'something'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['actualResultStatus']).to.eql('something')
      })
  });

  it('should return null result status if parameter is absent', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['actualResultStatus']).to.eql(null)
      })
  });

  it('should return null result status if input is empty string', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'resultStatus': ''})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['outputs']['actualResultStatus']).to.eql(null)
      })
  });

  it('should return error message if supplied in request', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'errorMessage': 'this is an error message'})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['error']).to.eql('this is an error message')
      })
  });

  it('should not return error message if input is empty string', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .send({'errorMessage': ''})
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['error']).to.eql(undefined)
      })
  });

  it('should not return null error message if parameter is absent', () => {
    return request(app)
      .post('/api/async-callback')
      .set('Content-Type', 'application/json')
      .then((response) => {
        expect(response.status).to.eql(202);
        expect(response.body['error']).to.eql(undefined)
      })
  });

});

describe('GET /api/data/array/integer', () => {
  it('should return counter elements in array of integers', () => {
    return request(app)
      .get('/api/data/array/integer?elements=10')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql([1,2,3,4,5,6,7,8,9,10]);
      })
  });  
});
