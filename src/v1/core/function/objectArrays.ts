

export const sumSingleObject = (
  obj: Record<string, any>,
  excludeKeys: string[] = []
): number => {
  let total = 0;

  for (const key in obj) {
    if (excludeKeys.includes(key)) {
      console.log(`[SKIP] Skipping key: ${key}, value: ${obj[key]}`);
      continue;
    }

    const num = Number(obj[key]);
    if (!isNaN(num)) {
      total += num;
    }
  }
  return total;
};


export const sumSingleArray = (arr: any[]): number => {
  let total = 0;

  for (const item of arr) {
    const num = Number(item);
    if (!isNaN(num)) {
      total += num;
    }
  }

  return total;
};


export const sumAnything = (value: any): number => {
  let total = 0;

  const traverse = (value: any): void => {
    if (Array.isArray(value)) {
      for (const item of value) {
        traverse(item);
      }
    } else if (typeof value === "object" && value !== null) {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          traverse(value[key]);
        }
      }
    } else {
      const num = Number(value);
      if (!isNaN(num)) {
        total += num;
      }
    }
  };

  traverse(value);

  return total;
};


export const filterObject = (obj: Record<string, any>) => {
  const result: Record<string, number> = {};
  for (const key in obj) {
    const value = Number(obj[key]); // 🔥 force to number
    // console.log("key & value >> ", key, value);
    if (!isNaN(value) && value > 0) {
      result[key] = value;
    }
  }
  return result;
};




