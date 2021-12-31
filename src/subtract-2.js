const subtract3 = (a, b, c) => {
  if (c === 0) {
    return a - b;
  } else return a - b - c;
};

const subtract4 = (a, b, c, d) => {
  return a - b - c - d;
};

export { subtract3, subtract4 };
