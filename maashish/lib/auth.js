// lib/auth.js
// ─── AUTHORIZED USERS ─────────────────────────────────────────────────────────
// Add, remove, or change users here. Only you have access to this file.
// Password is stored as plain text — keep this file private, never share it.

export const AUTHORIZED_USERS = [
    {
      email: 'owner@maashish.com',
      password: 'owner123',
      name: 'MAA Ashish',
      role: 'owner',       // sees everything
    },
    {
      email: 'manager@maashish.com',
      password: 'manager123',
      name: 'Manager',
      role: 'manager',
    },
    // Add more users like this:
    // {
    //   email: 'supervisor@maashish.com',
    //   password: 'super456',
    //   name: 'Supervisor',
    //   role: 'staff',
    // },
  ];
  
  // Session duration in hours
  export const SESSION_HOURS = 12;
  
  // Session storage key
  export const SESSION_KEY = 'maashish_session';
  
  export function findUser(email, password) {
    return AUTHORIZED_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    ) || null;
  }
  
  export function createSession(user) {
    const session = {
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  }
  
  export function getSession() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
  
  export function clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  }