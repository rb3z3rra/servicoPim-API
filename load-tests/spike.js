import http from 'k6/http';
import { check, sleep } from 'k6';
import { authHeaders, baseUrl, loginEmail, loginSenha } from './config.js';

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '15s', target: 40 },
    { duration: '30s', target: 40 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  const response = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ email: loginEmail, senha: loginSenha }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  return { token: response.json('accessToken') };
}

export default function (data) {
  const params = authHeaders(data.token);

  const responses = http.batch([
    ['GET', `${baseUrl}/dashboard`, null, params],
    ['GET', `${baseUrl}/ordens-servico?status=ABERTA`, null, params],
    ['GET', `${baseUrl}/ordens-servico?status=CONCLUIDA`, null, params],
    ['GET', `${baseUrl}/equipamentos?ativo=true`, null, params],
  ]);

  check(responses[0], { 'dashboard suportou pico': (response) => response.status === 200 });
  check(responses[1], { 'ordens abertas suportou pico': (response) => response.status === 200 });
  check(responses[2], { 'ordens concluídas suportou pico': (response) => response.status === 200 });
  check(responses[3], { 'equipamentos ativos suportou pico': (response) => response.status === 200 });

  sleep(1);
}
