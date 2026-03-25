import { socketEndpoint } from '../contexts/socket.context';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${socketEndpoint}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Erreur serveur');
  }

  return data;
}
