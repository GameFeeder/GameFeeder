function limitArray(array: any[], limit?: number): any[] {
  if (limit && (array.length > limit)) {
    return array.slice(array.length - limit, array.length);
  }
  return array;
}

export { limitArray };
