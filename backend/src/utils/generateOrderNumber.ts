import { v4 as uuidv4 } from 'uuid';

export function generateOrderNumber(): string {
  const prefix = 'EVT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().substring(0, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
