import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { authHeaders, baseUrl, loginEmail, loginSenha } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.03'],
    http_req_duration: ['p(95)<1200'],
  },
};

export function setup() {
  const response = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ email: loginEmail, senha: loginSenha }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'setup login 200': (res) => res.status === 200,
    'setup accessToken existe': (res) => Boolean(res.json('accessToken')),
  });

  return { token: response.json('accessToken') };
}

export default function (data) {
  const params = authHeaders(data.token);

  group('consultas principais', () => {
    check(http.get(`${baseUrl}/dashboard`, params), {
      'dashboard 200': (response) => response.status === 200,
    });
    check(http.get(`${baseUrl}/ordens-servico`, params), {
      'ordens 200': (response) => response.status === 200,
    });
    check(http.get(`${baseUrl}/equipamentos`, params), {
      'equipamentos 200': (response) => response.status === 200,
    });
    check(http.get(`${baseUrl}/usuarios`, params), {
      'usuarios 200': (response) => response.status === 200,
    });
  });

  sleep(1);
}
