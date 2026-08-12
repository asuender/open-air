export function hasItems<T>(array: T[]) {
  return array.length > 0;
}

export async function mapErrors<T>(
  operation: () => Promise<T>,
  mapError: (error: unknown) => never,
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    return mapError(err);
  }
}
