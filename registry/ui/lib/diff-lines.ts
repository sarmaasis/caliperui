export type DiffOp = { type: "eq" | "del" | "add"; text: string; a?: number; b?: number };

/** Line diff: trims what both sides share, then finds the longest common run of lines in the middle. */
export function diffLines(before: readonly string[], after: readonly string[]): DiffOp[] {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let endA = before.length,
    endB = after.length;
  while (endA > start && endB > start && before[endA - 1] === after[endB - 1]) {
    endA--;
    endB--;
  }
  const a = before.slice(start, endA),
    b = after.slice(start, endB);
  const ops: DiffOp[] = [];
  for (let i = 0; i < start; i++) ops.push({ type: "eq", text: before[i], a: i + 1, b: i + 1 });
  const n = a.length,
    m = b.length;
  if (n * m > 4_000_000) {
    a.forEach((text, i) => ops.push({ type: "del", text, a: start + i + 1 }));
    b.forEach((text, j) => ops.push({ type: "add", text, b: start + j + 1 }));
  } else {
    const width = m + 1;
    const table = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        table[i * width + j] = a[i] === b[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    let i = 0,
      j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) {
        ops.push({ type: "eq", text: a[i], a: start + i + 1, b: start + j + 1 });
        i++;
        j++;
      } else if (i < n && (j === m || table[(i + 1) * width + j] >= table[i * width + j + 1])) {
        ops.push({ type: "del", text: a[i], a: start + i + 1 });
        i++;
      } else {
        ops.push({ type: "add", text: b[j], b: start + j + 1 });
        j++;
      }
    }
  }
  for (let k = endA; k < before.length; k++) ops.push({ type: "eq", text: before[k], a: k + 1, b: endB + (k - endA) + 1 });
  return ops;
}

