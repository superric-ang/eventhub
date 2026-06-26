function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());
}

function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (typeof obj !== 'object') return obj;

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    if (key === 'id') {
      result._id = value;
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

export function transformEvent(event: any): any {
  if (!event) return event;
  const t = transformKeys(event);
  if (t.organizerId) t.organizer = t.organizerId;
  return t;
}

export function transformOrder(order: any): any {
  if (!order) return order;
  const t = transformKeys(order);
  if (t.buyerId) t.buyer = t.buyerId;
  if (t.eventId) t.event = t.eventId;
  return t;
}

export function transformPromo(promo: any): any {
  if (!promo) return promo;
  const t = transformKeys(promo);
  if (t.createdBy) t.createdBy = t.createdBy;
  return t;
}

export { transformKeys };
