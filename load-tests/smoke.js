import http from 'k6/http';
import { check, sleep } from 'k6';
import { authHeaders, baseUrl, loginEmail, loginSenha } from './config.js';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const login = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ email: loginEmail, senha: loginSenha }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(login, {
    'login retornou 200': (response) => response.status === 200,
    'login retornou accessToken': (response) => Boolean(response.json('accessToken')),
  });

  const token = login.json('accessToken');
  if (!token) return;

  const dashboard = http.get(`${baseUrl}/dashboard`, authHeaders(token));
  const ordens = http.get(`${baseUrl}/ordens-servico`, authHeaders(token));
  const equipamentos = http.get(`${baseUrl}/equipamentos`, authHeaders(token));

  check(dashboard, { 'dashboard retornou 200': (response) => response.status === 200 });
  check(ordens, { 'ordens retornou 200': (response) => response.status === 200 });
  check(equipamentos, { 'equipamentos retornou 200': (response) => response.status === 200 });

  sleep(1);
}
