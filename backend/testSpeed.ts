import http from 'http';

const start = Date.now();
const data = JSON.stringify({
  email: `test${Date.now()}@test.com`,
  password: 'password123',
  role: 'TENANT',
  name: 'Test User'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    console.log(`Registration took ${Date.now() - start}ms with status ${res.statusCode}`);
  });
});

req.on('error', console.error);
req.write(data);
req.end();
