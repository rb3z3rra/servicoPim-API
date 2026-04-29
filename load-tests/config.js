export const baseUrl = __ENV.BASE_URL || 'http://localhost:3333';
export const loginEmail = __ENV.LOGIN_EMAIL || 'supervisor@seed.local';
export const loginSenha = __ENV.LOGIN_SENHA || 'seed123';

export function authHeaders(accessToken) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
}
