import {Injectable} from 'angular2/core';
import {DIRECTIONS} from './directions.const';
import {Matrix, matrixMaxValueLocation, matrixFrameMaxValueLocation} from './matrix';

@Injectable()
export class SequenceAlignment {
    calculate(sequenceS, sequenceT, match, mismatch, gap, {nw, sw, oa, hb, lals}) {
        const rawMatrix = this.buildMatrix(sequenceS, sequenceT, match, mismatch, gap, { nw, sw, oa });
        const [matrix, finalS, finalT] = this.traceBack(sequenceS, sequenceT, rawMatrix, { nw, sw, oa });
        const score = this.finalScore(finalS, finalT, match, mismatch, gap);

        return [finalS, finalT, score, matrix];
    }

    finalScore(finalS, finalT, match, mismatch, gap) {
        let score = 0;

        for (let i = 0; i < finalS.length; i++) {
            if (finalS[i] === finalT[i]) {
                score += match;
            } else if (finalS[i] === '-' || finalT[i] === '-') {
                score += gap;
            } else {
                score += mismatch;
            }
        }

        return score;
    }

    private buildMatrix(sequenceS, sequenceT, match, mismatch, gap, {nw, sw, oa}) {
        // init matrix with zeros
        const numRows = sequenceS.length + 1;
        const numCols = sequenceT.length + 1;
        const mat = Matrix({ rows: numRows, columns: numCols });

        // fill first column
        for (let row = 1; row < numRows; row++) {
            if (nw) {
                // Needleman-Wunsch: init first row as a comulative sum of the gap penalty value.
                mat[row][0] = { value: mat[row - 1][0].value + gap, direction: DIRECTIONS.UP };
            } else if (oa) {
                // Overlap-Alignment: init first row with zeros and standard direction.
                mat[row][0].direction = DIRECTIONS.UP;
            }
            // Smith-Waterman: init first row with zeros with no direction.
        }

        // fill first row
        for (let col = 1; col < numCols; col++) {
            if (nw) {
                // Needleman-Wunsch: init first column as a comulative sum of the gap penalty value.
                mat[0][col] = { value: mat[0][col - 1].value + gap, direction: DIRECTIONS.LEFT };
            } else if (oa) {
                // Overlap-Alignment: init first column with zeros and standard direction.
                mat[0][col].direction = DIRECTIONS.LEFT;
            }
            // Smith-Waterman: init first column with zeros with no direction.
        }

        // fill the matrix
        for (let row = 1; row < numRows; row++) {
            for (let col = 1; col < numCols; col++) {
                const up = mat[row - 1][col].value + gap;
                const left = mat[row][col - 1].value + gap;
                const diagonal = mat[row - 1][col - 1].value +
                    (sequenceS[row - 1] == sequenceT[col - 1] ? match : mismatch);

                // set zero value to zero if Smith-Waterman, otherwise set to the minimum integer.
                const zero = sw ? 0 : Number.MIN_SAFE_INTEGER;
                const maxVal = Math.max(up, left, diagonal, zero);
                let maxDirection;

                if (maxVal == up) {
                    maxDirection = DIRECTIONS.UP;
                } else if (maxVal == left) {
                    maxDirection = DIRECTIONS.LEFT;
                } else if (maxVal == diagonal) {
                    maxDirection = DIRECTIONS.DIAG;
                }

                if (sw && maxVal === zero) {
                    // in case that one of [up, left, diagonal] is zero
                    maxDirection = null;
                }

                mat[row][col].value = maxVal;
                mat[row][col].direction = maxDirection;
            }
        }

        return mat;
    }

    private traceBack(sequenceS, sequenceT, matrix, {nw, sw, oa}) {
        let finalS = '';
        let finalT = '';
        let shouldStop;
        let tbRowIndex;
        let tbColIndex;

        if (nw) {
            // Needleman-Wunsch: trace back from final cell
            tbRowIndex = sequenceS.length;
            tbColIndex = sequenceT.length;
        } else if (sw) {
            // Smith-Waterman: trace back from the cell that have biggest value
            const smithWatermanStartLocation = matrixMaxValueLocation(matrix, sequenceS.length + 1, sequenceT.length + 1);
            tbRowIndex = smithWatermanStartLocation.row;
            tbColIndex = smithWatermanStartLocation.col;
        } else if (oa) {
            // Overlap-Alignment: trace back from cell A[i,m] or A[n,j] with maximum score
            const overlapAlignmentStartLocation = matrixFrameMaxValueLocation(matrix, sequenceS.length + 1, sequenceT.length + 1);
            tbRowIndex = overlapAlignmentStartLocation.row;
            tbColIndex = overlapAlignmentStartLocation.col;
        }

        while (!shouldStop) {
            matrix[tbRowIndex][tbColIndex].trace = true;
            const direction = matrix[tbRowIndex][tbColIndex].direction;
            if (direction == DIRECTIONS.UP) {
                tbRowIndex -= 1;
                finalT += '-';
                finalS += sequenceS[tbRowIndex];
            } else if (direction == DIRECTIONS.LEFT) {
                tbColIndex -= 1;
                finalS += '-';
                finalT += sequenceT[tbColIndex];
            } else if (direction == DIRECTIONS.DIAG) {
                tbColIndex -= 1;
                tbRowIndex -= 1;
                finalS += sequenceS[tbRowIndex];
                finalT += sequenceT[tbColIndex];
            } else {
                shouldStop = true;
            }
        }

        finalS = this._reverseString(finalS);
        finalT = this._reverseString(finalT);

        if (oa) {
            const finalTWithoutGaps = finalT.replace(/-/g, '');
            const finalTMissingPart = sequenceT.substr(finalTWithoutGaps.length);
            finalT += finalTMissingPart;

            const finalSWithoutGaps = finalS.replace(/-/g, '');
            const finalSMissingPart = sequenceS.substr(finalSWithoutGaps.length);
            finalS += finalSMissingPart;

            while (finalS.length !== finalT.length) {
                if (finalS.length > finalT.length) {
                    finalT += '-';
                } else {
                    finalS += '-';
                }
            }
        }

        return [matrix, finalS, finalT];
    }

    private _reverseString(str) {
        return str.split("").reverse().join("");
    }
}