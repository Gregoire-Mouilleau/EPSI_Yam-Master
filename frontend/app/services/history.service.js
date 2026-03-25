import { socketEndpoint } from '../contexts/socket.context';

async function request(path, token) {
  const response = await fetch(`${socketEndpoint}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Erreur serveur');
  }
  return data;
}

export async function fetchHistory(userId, token) {
  try {
    const data = await request(`/api/history/${userId}`, token);
    return { success: true, history: data.history || [] };
  } catch (error) {
    return { success: false, message: error.message, history: [] };
  }
}

export async function fetchGameDetail(gameId, token) {
  try {
    const data = await request(`/api/history/game/${gameId}`, token);
    return { success: true, game: data.game };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
