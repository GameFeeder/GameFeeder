// Mock for node-fetch in Jest environment
function fetch(url, options) {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      raw: () => ({}),
      get: () => '',
      forEach: () => {},
    },
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    buffer: () => Promise.resolve(Buffer.from('')),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve({}),
  });
}

// Add any other required exports
fetch.isRedirect = () => false;
const Response = class {};
const Headers = class {};
const Request = class {};

// biome-ignore-start lint: Use CommonJS exports format instead of ESM
module.exports = fetch;
module.exports.Response = Response;
module.exports.Headers = Headers;
module.exports.Request = Request;
// biome-ignore-end lint: Use CommonJS exports format instead of ESM
