const API_URL = 'http://localhost:3000/api';

// Función auxiliar para inyectar el token automáticamente
const getAuthHeaders = () => {
  const token = localStorage.getItem('argos_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// --- AUTENTICACIÓN ---
export const login = async (credenciales) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credenciales)
  });
  if (!res.ok) throw new Error('Credenciales inválidas');
  return res.json();
};

// --- ALUMNAS Y PAQUETES ---
export const getAlumnas = async () => {
  const res = await fetch(`${API_URL}/alumnas`, { 
    headers: getAuthHeaders() 
  });
  return res.json();
};

export const getPaquetes = async () => {
  const res = await fetch(`${API_URL}/paquetes`, { 
    headers: getAuthHeaders() 
  });
  return res.json();
};

export const createAlumna = async (alumnaData) => {
  const res = await fetch(`${API_URL}/alumnas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(alumnaData)
  });
  return res.json();
};

export const updateAlumna = async (id, data) => {
  const res = await fetch(`${API_URL}/alumnas/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteAlumna = async (id) => {
  const res = await fetch(`${API_URL}/alumnas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return res.json();
};

// --- PAGOS ---
export const getPagos = async () => {
  const res = await fetch(`${API_URL}/pagos`, { 
    headers: getAuthHeaders() 
  });
  return res.json();
};

export const marcarPagoPagado = async (id) => {
  const res = await fetch(`${API_URL}/pagos/${id}/pagar`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  return res.json();
};

export const forzarRecargos = async () => {
  const res = await fetch(`${API_URL}/pagos/forzar-corte-recargo`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return res.json();
};