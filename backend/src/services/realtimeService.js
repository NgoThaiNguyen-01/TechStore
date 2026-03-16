import crypto from 'crypto';
import { URL } from 'url';
import { verifyAccessToken } from '../utils/token.js';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const clients = new Set();
const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'PRODUCT_MANAGER', 'INVENTORY']);

const encodeFrame = (payload) => {
  const source = Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));
  let header = null;

  if (source.length < 126) {
    header = Buffer.from([0x81, source.length]);
  } else if (source.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(source.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(source.length), 2);
  }

  return Buffer.concat([header, source]);
};

const closeClient = (client) => {
  if (!client) return;
  clients.delete(client);
  try {
    client.socket.end();
  } catch {
    void 0;
  }
};

const sendToClient = (client, payload) => {
  if (!client?.socket || client.socket.destroyed) {
    clients.delete(client);
    return;
  }

  try {
    client.socket.write(encodeFrame(payload));
  } catch {
    closeClient(client);
  }
};

const shouldReceiveEvent = (client, event) => {
  const audience = String(event?.audience || 'all').trim().toLowerCase();
  if (audience === 'all') return true;

  if (audience === 'admins') {
    return ADMIN_ROLES.has(client.role);
  }

  if (audience === 'user') {
    return String(client.userId) === String(event?.userId || '');
  }

  if (audience === 'roles') {
    const roles = Array.isArray(event?.roles) ? event.roles : [];
    return roles.includes(client.role);
  }

  return false;
};

const parseAuthFromUpgrade = (req) => {
  const requestUrl = new URL(req.url || '/ws', 'http://localhost');
  const token = String(requestUrl.searchParams.get('token') || '').trim();
  if (!token) return null;

  const decoded = verifyAccessToken(token);
  return {
    userId: String(decoded.userId || ''),
    role: String(decoded.role || '')
  };
};

const handleIncomingFrame = (client, buffer) => {
  if (!buffer || buffer.length < 2) return;
  const opcode = buffer[0] & 0x0f;

  if (opcode === 0x8) {
    closeClient(client);
    return;
  }

  if (opcode === 0x9) {
    try {
      client.socket.write(Buffer.from([0x8a, 0x00]));
    } catch {
      closeClient(client);
    }
  }
};

export const attachRealtimeServer = (server) => {
  server.on('upgrade', (req, socket) => {
    if (!String(req.url || '').startsWith('/ws')) {
      socket.destroy();
      return;
    }

    let auth = null;
    try {
      auth = parseAuthFromUpgrade(req);
    } catch {
      auth = null;
    }

    if (!auth?.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(`${key}${WS_GUID}`)
      .digest('base64');

    socket.write([
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n'
    ].join('\r\n'));

    const client = {
      socket,
      userId: auth.userId,
      role: auth.role
    };

    clients.add(client);
    sendToClient(client, {
      type: 'realtime.connected',
      audience: 'user',
      userId: auth.userId,
      timestamp: new Date().toISOString()
    });

    socket.on('data', (buffer) => handleIncomingFrame(client, buffer));
    socket.on('close', () => clients.delete(client));
    socket.on('end', () => clients.delete(client));
    socket.on('error', () => clients.delete(client));
  });
};

export const emitRealtimeEvent = (event = {}) => {
  const payload = {
    type: String(event?.type || 'system.updated').trim(),
    audience: event?.audience || 'all',
    userId: event?.userId ? String(event.userId) : '',
    roles: Array.isArray(event?.roles) ? event.roles : [],
    data: event?.data && typeof event.data === 'object' ? event.data : {},
    timestamp: new Date().toISOString()
  };

  if (!payload.type) return;

  clients.forEach((client) => {
    if (shouldReceiveEvent(client, payload)) {
      sendToClient(client, payload);
    }
  });
};
