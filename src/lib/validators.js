// lib/validators.js
export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const usernameRe = /^[A-Za-z0-9_]{3,20}$/;
export const passwordRe =
  /^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{}|\\;:'",.<>/?`~]).{8,72}$/;

export function validateEmail(v) {
  return emailRe.test(v);
}
export function validateUsername(v) {
  return usernameRe.test(v);
}
export function validatePassword(v) {
  return passwordRe.test(v);
}
