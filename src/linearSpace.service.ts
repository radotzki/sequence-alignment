import {Injectable} from 'angular2/core';
import {Matrix} from './matrix';
import {SequenceAlignment} from './sequenceAlignment.service';

@Injectable()
export class LinearSpace {
    constructor(
        private _sequenceAlignment: SequenceAlignment
    ) { }

    calc(sequenceS, sequenceT, match, mismatch, gap, {hb, la}) {
        let finalS, finalT;

        if (hb) {
            [finalS, finalT] = this.Hirschberg(sequenceS, sequenceT, match, mismatch, gap);
        } else {
            [finalS, finalT] = this.localAlignment(sequenceS, sequenceT, match, mismatch, gap);
        }

        const score = this._sequenceAlignment.finalScore(finalS, finalT, match, mismatch, gap);

        return [finalS, finalT, score];
    }

    private localAlignment(sequenceS, sequenceT, match, mismatch, gap) {
        // find the end point location
        const endPointLocation = this.findEndPoint(sequenceS, sequenceT, match, mismatch, gap);

        // prune the sequences beyond the end point location
        const prunedSequenceS = sequenceS.substring(0, endPointLocation.s);
        const prunedSequenceT = sequenceT.substring(0, endPointLocation.t);

        // find start location: reverse the pruned sequences and find the end location
        const prunedSequenceSReverse = this._reverseString(prunedSequenceS);
        const prunedSequenceTReverse = this._reverseString(prunedSequenceT);
        const endPointLocationReverse = this.findEndPoint(prunedSequenceSReverse, prunedSequenceTReverse, match, mismatch, gap);

        // prune the sequences before the start point location
        const localS = this._reverseString(prunedSequenceSReverse.substring(0, endPointLocationReverse.s));
        const localT = this._reverseString(prunedSequenceTReverse.substring(0, endPointLocationReverse.t));
        const [finalS, finalT] = this.Hirschberg(localS, localT, match, mismatch, gap);

        return [finalS, finalT];
    }

    private findEndPoint(sequenceS, sequenceT, match, mismatch, gap) {
        // returns the cell location with the maximum value in the dp matrix
        // done in linear space complexity
        let maxVal = Number.MIN_SAFE_INTEGER;
        let maxLocation = { s: 0, t: 0 };

        if (sequenceS.length > sequenceT.length) {
            const numCols = sequenceT.length + 1;
            const numRows = sequenceS.length + 1;
            const mat = Matrix({ rows: 2, columns: numCols });

            // fill matrix
            for (let row = 1; row < numRows; row++) {
                // copy previous values
                for (let col = 0; col < numCols; col++) {
                    mat[0][col] = _.clone(mat[1][col]);
                }

                for (let col = 1; col < numCols; col++) {
                    const zero = 0;
                    const up = mat[0][col].value + gap;
                    const left = mat[1][col - 1].value + gap;
                    const diagonal = mat[0][col - 1].value + (sequenceS[row - 1] == sequenceT[col - 1] ? match : mismatch);

                    mat[1][col] = { value: Math.max(zero, up, left, diagonal) };

                    if (mat[1][col].value > maxVal) {
                        maxVal = mat[1][col].value;
                        maxLocation = { s: row, t: col };
                    }
                }
            }
        } else {
            const numCols = sequenceS.length + 1;
            const numRows = sequenceT.length + 1;
            const mat = Matrix({ rows: numRows, columns: 2 });

            // fill matrix
            for (let col = 1; col < numCols; col++) {
                // copy previous values
                for (let row = 0; row < numRows; row++) {
                    mat[row][0] = _.clone(mat[row][1]);
                }

                for (let row = 1; row < numRows; row++) {
                    const zero = 0;
                    const up = mat[row][0].value + gap;
                    const left = mat[row - 1][1].value + gap;
                    const diagonal = mat[row - 1][0].value + (sequenceS[col - 1] == sequenceT[row - 1] ? match : mismatch);

                    mat[row][1] = { value: Math.max(zero, up, left, diagonal) };

                    if (mat[row][1].value > maxVal) {
                        maxVal = mat[row][1].value;
                        maxLocation = { t: row, s: col };
                    }
                }
            }
        }

        return maxLocation;
    }

    private Hirschberg(sequenceS, sequenceT, match, mismatch, gap) {
        // very good description of this algorithm:
        // https://en.wikipedia.org/wiki/Hirschberg%27s_algorithm#Algorithm_description
        let finalS = '';
        let finalT = '';

        if (sequenceS.length == 0) {
            for (let i = 0; i < sequenceT.length; i++) {
                finalS += '-';
                finalT += sequenceT[i];
            }
        } else if (sequenceT.length == 0) {
            for (let i = 0; i < sequenceS.length; i++) {
                finalS += sequenceS[i];
                finalT += '-';
            }
        } else if (sequenceS.length == 1 || sequenceT.length == 1) {
            [finalS, finalT] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, { nw: true });
        } else {
            const slen = sequenceS.length;
            const smid = sequenceS.length / 2;
            const tlen = sequenceT.length;

            const scoreL = this.NWScore(sequenceS.substring(0, smid), sequenceT, match, mismatch, gap);
            const scoreR = this.NWScore(this._reverseString(sequenceS.substring(smid, slen)), this._reverseString(sequenceT), match, mismatch, gap);
            const ymid = this.PartitionY(scoreL, scoreR);

            const [finalS1, finalT1] = this.Hirschberg(sequenceS.substring(0, smid), sequenceT.substring(0, ymid), match, mismatch, gap);
            const [finalS2, finalT2] = this.Hirschberg(sequenceS.substring(smid, slen), sequenceT.substring(ymid, tlen), match, mismatch, gap);
            finalS = finalS1 + finalS2;
            finalT = finalT1 + finalT2;
        }

        return [finalS, finalT];
    }

    private NWScore(sequenceS, sequenceT, match, mismatch, gap) {
        if (sequenceS.length > sequenceT.length) {
            const numCols = sequenceT.length + 1;
            const numRows = sequenceS.length + 1;
            const mat = Matrix({ rows: 2, columns: numCols });

            // init first row
            for (let col = 1; col < numCols; col++) {
                mat[1][col] = { value: mat[1][col - 1].value + gap };
            }

            // fill matrix
            for (let row = 1; row < numRows; row++) {
                // copy previous values
                for (let col = 0; col < numCols; col++) {
                    mat[0][col] = _.clone(mat[1][col]);
                }

                mat[1][0] = { value: mat[0][0].value + gap };
                for (let col = 1; col < numCols; col++) {
                    const up = mat[0][col].value + gap;
                    const left = mat[1][col - 1].value + gap;
                    const diagonal = mat[0][col - 1].value + (sequenceS[row - 1] == sequenceT[col - 1] ? match : mismatch);

                    mat[1][col] = { value: Math.max(up, left, diagonal) };
                }
            }

            return mat[1];
        } else {
            const numCols = sequenceS.length + 1;
            const numRows = sequenceT.length + 1;
            const mat = Matrix({ rows: numRows, columns: 2 });

            // init first column
            for (let row = 1; row < numRows; row++) {
                mat[row][1] = { value: mat[row - 1][1].value + gap };
            }

            // fill matrix
            for (let col = 1; col < numCols; col++) {
                // copy previous values
                for (let row = 0; row < numRows; row++) {
                    mat[row][0] = _.clone(mat[row][1]);
                }

                mat[0][1] = { value: mat[0][0].value + gap };
                for (let row = 1; row < numRows; row++) {
                    const up = mat[row][0].value + gap;
                    const left = mat[row - 1][1].value + gap;
                    const diagonal = mat[row - 1][0].value + (sequenceS[col - 1] == sequenceT[row - 1] ? match : mismatch);

                    mat[row][1] = { value: Math.max(up, left, diagonal) };
                }
            }

            return _.map(mat, col => col[1]);
        }
    }

    private PartitionY(scoreL, scoreR) {
        // returns the index of the maximum sum of scoreL and scoreR
        let maxVal = Number.MIN_SAFE_INTEGER;
        let maxIndex = 0;

        for (let j = 0; (j < scoreR.length && j < scoreL.length); j++) {
            if (scoreL[j].value + scoreR[scoreR.length - 1 - j].value > maxVal) {
                maxVal = scoreL[j].value + scoreR[scoreR.length - 1 - j].value;
                maxIndex = j;
            }
        }

        return maxIndex;
    }

    private _reverseString(str) {
        return str.split("").reverse().join("");
    }
}
