export function getPaginationParams(query: any) {
  let limit = parseInt(query.limit as string) || 20;
  let offset = parseInt(query.offset as string) || 0;

  if (limit > 100) limit = 100;
  if (limit < 1) limit = 20;
  if (offset < 0) offset = 0;

  return { limit, offset };
}
