import {bootstrap} from 'angular2/platform/browser';
import {Component, enableProdMode, OnInit} from 'angular2/core';
import {FormBuilder, Validators} from 'angular2/common';
import {TableComponent} from './table.component';
import {SequenceAlignment} from './sequenceAlignment.service';
import {LinearSpace} from './linearSpace.service';
import {SumHomology} from './sumHomology.service';
import {Observable} from 'rxjs/Observable';

@Component({
    selector: 'app',
    directives: [TableComponent],
    providers: [SequenceAlignment, LinearSpace, SumHomology],
    template: `
  <section class="container">
    <section class="form-container">
        <h1> Sequence Alignment </h1>
        <form [ngFormModel]="form" novalidate>
        <div class="form-group">
            <label>Sequence S:</label>
            <input type="text" ngControl="sequenceS" #sequenceS class="form-control">
        </div>

        <div class="form-group">
            <label>Sequence T:</label>
            <input type="text" ngControl="sequenceT" #sequenceT class="form-control">
        </div>

        <div class="row">
            <div class="form-group col-sm-4">
            <label>Match score:</label>
            <input type="number" ngControl="match" class="form-control">
            </div>

            <div class="form-group col-sm-4">
            <label>Mismatch score:</label>
            <input type="number" ngControl="mismatch" class="form-control">
            </div>

            <div class="form-group col-sm-4">
            <label>Gap score:</label>
            <input type="number" ngControl="gap" class="form-control">
            </div>
        </div>
        </form>
    </section>

    <section class="matrix" *ngIf="hbFinalS && hbFinalT">
      <h3> <a href="https://en.wikipedia.org/wiki/Hirschberg%27s_algorithm" target="_blank"> Hirschberg </a> </h3>
      <table-component
        [finalT]="hbFinalS"
        [finalS]="hbFinalT"
        [score]="hbScore">
      </table-component>
    </section>

    <section class="matrix" *ngIf="lalsFinalS && lalsFinalT">
      <h3> Local Alignment in Linear Space </h3>
      <table-component
        [finalT]="lalsFinalS"
        [finalS]="lalsFinalT"
        [score]="lalsScore">
      </table-component>
    </section>

    <section class="matrix" *ngIf="nwMatrix">
      <h3> <a href="https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm" target="_blank"> Needleman-Wunsch </a> </h3>
      <table-component
        [matrix]="nwMatrix"
        [sequenceT]="sequenceT.value"
        [sequenceS]="sequenceS.value"
        [finalT]="nwFinalS"
        [finalS]="nwFinalT"
        [score]="nwScore">
      </table-component>
    </section>

    <section class="matrix" *ngIf="swMatrix">
      <h3> <a href="https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm" target="_blank"> Smith-Waterman </a> </h3>
      <table-component
        [matrix]="swMatrix"
        [sequenceT]="sequenceT.value"
        [sequenceS]="sequenceS.value"
        [finalT]="swFinalS"
        [finalS]="swFinalT"
        [score]="swScore">
      </table-component>
    </section>

    <section class="matrix" *ngIf="oaMatrix">
      <h3> Overlap-Alignment </h3>
      <table-component
        [matrix]="oaMatrix"
        [sequenceT]="sequenceT.value"
        [sequenceS]="sequenceS.value"
        [finalT]="oaFinalS"
        [finalS]="oaFinalT"
        [score]="oaScore">
      </table-component>
    </section>

    <section class="matrix" *ngIf="sumHomologyScore">
      <h3> Sum Homology </h3>
      <p> Score: {{sumHomologyScore}} </p>
    </section>
  </section>
  `,
})
class App implements OnInit {
    form;

    constructor(
        private _sequenceAlignment: SequenceAlignment,
        private _linearSpace: LinearSpace,
        private _sumHomology: SumHomology,
        private _formBuilder: FormBuilder
    ) { }

    ngOnInit() {
        const defaultValues = {
            sequenceS: 'GATTAAGCCAAGGTTCCCCG',
            sequenceT: 'AATCTAATCCAGGTTCGCG',
            match: 2,
            mismatch: -2,
            gap: -3,
        };

        this.form = this._formBuilder.group({
            "sequenceS": [defaultValues.sequenceS, Validators.required],
            "sequenceT": [defaultValues.sequenceT, Validators.required],
            "match": [defaultValues.match, Validators.required],
            "mismatch": [defaultValues.mismatch, Validators.required],
            "gap": [defaultValues.gap, Validators.required],
        });

        this.form.valueChanges.subscribe(this._calc.bind(this));
        this._calc(defaultValues);
    }

    private _calc({sequenceS, sequenceT, match, mismatch, gap}) {
        [this.nwFinalS, this.nwFinalT, this.nwScore, this.nwMatrix] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, { nw: true });
        [this.swFinalS, this.swFinalT, this.swScore, this.swMatrix] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, { sw: true });
        [this.oaFinalS, this.oaFinalT, this.oaScore, this.oaMatrix] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, { oa: true });
        [this.hbFinalS, this.hbFinalT, this.hbScore] = this._linearSpace.calc(sequenceS, sequenceT, match, mismatch, gap, {hb: true});
        [this.lalsFinalS, this.lalsFinalT, this.lalsScore] = this._linearSpace.calc(sequenceS, sequenceT, match, mismatch, gap, {la: true});
        [this.sumHomologyMatrix, this.sumHomologyScore] = this._sumHomology.calc(sequenceS, sequenceT, 32/160, 2/160, 1/160);


        // Tests
        // Hirschberg
        const [hbFinalStest, hbFinalTtest, hbScoreTest] = this._linearSpace.calc('AGTACGCA', 'TATGC', 2, -1, -2, {hb: true});
        if (hbFinalStest !== 'AGTACGCA' ||
            hbFinalTtest !== '--TATGC-' ||
            hbScoreTest !== 1) {
            console.log('test error!');
            console.log('s: ', hbFinalStest);
            console.log('t: ', hbFinalTtest);
            console.log('score: ', hbScoreTest);
        }

        // Hirschberg
        const [nwFinalStest2, nwFinalTtest2, nwScoreTest2, nwmatTest2] = this._sequenceAlignment.calculate('GATTAAGCCAAGGTTCCCCG', 'AATCTAATCCAGGTTCGCG', 2, -2, -3, { nw: true });
        const [hbFinalStest2, hbFinalTtest2, hbScoreTest2] = this._linearSpace.calc('GATTAAGCCAAGGTTCCCCG', 'AATCTAATCCAGGTTCGCG', 2, -2, -3, {hb: true});
        if (nwScoreTest2 !== hbScoreTest2) {
            console.log('test error!');
            console.log('nw score: ', nwScoreTest2);
            console.log('hb score: ', hbScoreTest2);
        }

        // local alignment linear space
        const [lalsFinalSTest, lalsFinalTTest, lalsScoreTest] = this._linearSpace.calc('GATTAAGCCAAGGTTC', 'CTAATCCAGGT', 2, -2, -3, {la: true});
        if (lalsFinalSTest != 'TAAGCCAAGGT' ||
            lalsFinalTTest != 'TAATCCA-GGT' ||
            lalsScoreTest != 13) {
            console.log('test error!');
            console.log('lals s: ', lalsFinalSTest);
            console.log('lals t: ', lalsFinalTTest);
            console.log('score: ', lalsScoreTest);
        }

        // local alignment linear space
        const [lalsFinalSTest2, lalsFinalTTest2, lalsScoreTest2] = this._linearSpace.calc('AGTACGCA', 'TATGC', 2, -1, -2, {la: true});
        if (lalsFinalSTest2 !== 'TACGC' ||
            lalsFinalTTest2 !== 'TATGC' ||
            lalsScoreTest2 !== 7) {
            console.log('test error! local alignment linear space');
            console.log('s: ', lalsFinalSTest2);
            console.log('t: ', lalsFinalTTest2);
            console.log('score: ', lalsScoreTest2);
        }
    }
}

enableProdMode();
bootstrap(App)
    .catch(err => console.error(err));