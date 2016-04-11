import {bootstrap} from 'angular2/platform/browser';
import {Component, enableProdMode, OnInit} from 'angular2/core';
import {FormBuilder, Validators} from 'angular2/common';
import {TableComponent} from './table.component';
import {SequenceAlignment} from './sequenceAlignment.service';
import {Observable} from 'rxjs/Observable';

@Component({
    selector: 'app',
    directives: [TableComponent],
    providers: [SequenceAlignment],
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
  </section>
  `,
})
class App implements OnInit {
    form;

    constructor(
        private _sequenceAlignment: SequenceAlignment,
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
        [this.hbFinalS, this.hbFinalT, this.hbScore] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, { hb: true });

        // just for test:
        const [hbFinalStest, hbFinalTtest, hbScoreTest] = this._sequenceAlignment.calculate('AGTACGCA', 'TATGC', 2, -1, -2, { hb: true });
        if (hbFinalStest !== 'AGTACGCA' ||
            hbFinalTtest !== '--TATGC-' ||
            hbScoreTest !== 1) {
            console.log('test error!');
            console.log('s: ', hbFinalStest);
            console.log('t: ', hbFinalTtest);
            console.log('score: ', hbScoreTest);
        }

        const [nwFinalStest2, nwFinalTtest2, nwScoreTest2, nwmatTest2] = this._sequenceAlignment.calculate('GATTAAGCCAAGGTTCCCCG', 'AATCTAATCCAGGTTCGCG', 2, -2, -3, { nw: true });
        const [hbFinalStest2, hbFinalTtest2, hbScoreTest2] = this._sequenceAlignment.calculate('GATTAAGCCAAGGTTCCCCG', 'AATCTAATCCAGGTTCGCG', 2, -2, -3, { hb: true });
        if (nwScoreTest2 !== hbScoreTest2) {
            console.log('test error!');
            console.log('nw score: ', nwScoreTest2);
            console.log('hb score: ', hbScoreTest2);
        }
    }
}

// enableProdMode();
bootstrap(App)
    .catch(err => console.error(err));