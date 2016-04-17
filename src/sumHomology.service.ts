import {Injectable} from 'angular2/core';
import {Matrix} from './matrix';

@Injectable()
export class SumHomology {
    calc(sequenceS, sequenceT, matchProb, mismatchProb, gapProb) {
        // init matrix with ones
        const numRows = sequenceS.length + 1;
        const numCols = sequenceT.length + 1;
        const mat = Matrix({ rows: numRows, columns: numCols });
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                mat[row][col].value = 1;
            }
        }

        // calculate scores from probabilities using the log function
        const match = Math.log(matchProb);
        const mismatch = Math.log(mismatchProb);
        const gap = Math.log(gapProb);

        // fill the matrix
        for (let row = 1; row < numRows; row++) {
            for (let col = 1; col < numCols; col++) {
                const up = mat[row - 1][col].value * gap;
                const left = mat[row][col - 1].value * gap;
                const diagonal = mat[row - 1][col - 1].value *
                    (sequenceS[row - 1] == sequenceT[col - 1] ? match : mismatch);

                mat[row][col].value = up + left + diagonal;
            }
        }

        return [mat, mat[numRows - 1][numCols - 1].value];
    }
}
