// Matrix operations for linear algebra and OLS regression

export function transpose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const result: number[][] = [];
  for (let j = 0; j < cols; j++) {
    result[j] = new Array(rows);
    for (let i = 0; i < rows; i++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

export function matMul(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Matrix dimensions mismatch for multiplication: ${colsA} !== ${rowsB}`);
  }

  const result: number[][] = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = new Array(colsB).fill(0);
    for (let k = 0; k < colsA; k++) {
      const a = A[i][k];
      for (let j = 0; j < colsB; j++) {
        result[i][j] += a * B[k][j];
      }
    }
  }
  return result;
}

export function matVecMul(A: number[][], v: number[]): number[] {
  const rows = A.length;
  const cols = A[0].length;
  if (cols !== v.length) {
    throw new Error(`Matrix-vector dimension mismatch: cols ${cols} !== vector len ${v.length}`);
  }
  const result: number[] = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

// Invert square matrix using Gauss-Jordan elimination with partial pivoting
export function invertMatrix(A: number[][]): number[][] {
  const n = A.length;
  if (n === 0 || A[0].length !== n) {
    throw new Error("Matrix must be square to invert");
  }

  // Clone matrix and create augmented identity matrix
  const M: number[][] = [];
  const I: number[][] = [];
  for (let i = 0; i < n; i++) {
    M[i] = [...A[i]];
    I[i] = new Array(n).fill(0);
    I[i][i] = 1;
  }

  for (let i = 0; i < n; i++) {
    // Partial pivoting: find maximum element in current column
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxVal) {
        maxVal = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      throw new Error("Matrix is singular or nearly singular (perfect multicollinearity detected). Cannot compute inverse.");
    }

    // Swap rows
    if (maxRow !== i) {
      const tempM = M[i];
      M[i] = M[maxRow];
      M[maxRow] = tempM;

      const tempI = I[i];
      I[i] = I[maxRow];
      I[maxRow] = tempI;
    }

    // Scale pivot row to 1
    const pivot = M[i][i];
    for (let j = 0; j < n; j++) {
      M[i][j] /= pivot;
      I[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        if (Math.abs(factor) > 1e-14) {
          for (let j = 0; j < n; j++) {
            M[k][j] -= factor * M[i][j];
            I[k][j] -= factor * I[i][j];
          }
        }
      }
    }
  }

  return I;
}
