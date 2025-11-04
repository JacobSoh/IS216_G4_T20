import React from 'react';

// --- Actions
export const INSERT = 1;
export const REMOVE = 2;

// --- Helpers
export const toNode = (content) =>
  React.isValidElement(content) ? content : content ? React.createElement(content) : null;

export const newKey = () => (globalThis.crypto?.randomUUID?.() ?? String(Math.random()));
