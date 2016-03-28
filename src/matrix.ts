export function Matrix(opts) {
    if (!(this instanceof Matrix)) return new Matrix(opts);

    const numRows = opts.rows;
    const numCols = opts.columns;

    for (var i = 0; i < numRows; i++) {
        this[i] = [];

        for (var j = 0; j < numCols; j++) {
            this[i][j] = {value: 0};
        }
    }
}

export function matrixMaxValueLocation(matrix, numRows, numCols) {
    let biggestValue = 0;
    let biggestLoc = {row: 0, col:0};
    for (let row = 1; row < numRows; row++) {
        for (let col = 1; col < numCols; col++) {
          if (matrix[row][col].value > biggestValue) {
            biggestValue = matrix[row][col].value;
            biggestLoc = {row, col};
          }
        }
    }

    return biggestLoc;
}

export function matrixFrameMaxValueLocation(matrix, numRows, numCols) {
    let biggestValue = 0;
    let biggestLoc = {row: 0, col:0};

    for (let row = 1; row < numRows; row++) {
      const col = numCols - 1;
      if (matrix[row][col].value > biggestValue) {
          biggestValue = matrix[row][col].value;
          biggestLoc = {row, col};
        }
    }

    for (let col = 1; col < numCols; col++) {
      const row = numRows - 1;
      if (matrix[row][col].value > biggestValue) {
          biggestValue = matrix[row][col].value;
          biggestLoc = {row, col};
        }
    }

    return biggestLoc;
}
