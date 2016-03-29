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

    <section class="matrix" *ngIf="nwMatrix">
      <h3> Needleman-Wunsch </h3>
      <table-component
        [matrix]="nwMatrix"
        [sequenceT]="sequenceT.value"
        [sequenceS]="sequenceS.value"
        [finalT]="nwFinalS"
        [finalS]="nwFinalT">
      </table-component>
    </section>

    <section class="matrix" *ngIf="swMatrix">
      <h3> Smith-Waterman </h3>
      <table-component
        [matrix]="swMatrix"
        [sequenceT]="sequenceT.value"
        [sequenceS]="sequenceS.value"
        [finalT]="swFinalS"
        [finalS]="swFinalT">
      </table-component>
    </section>

    <section class="matrix" *ngIf="oaMatrix">
      <h3> Overlap-Alignment </h3>
      <table-component
        [matrix]="oaMatrix"
        [sequenceT]="sequenceT.value"
        [sequenceS]="sequenceS.value"
        [finalT]="oaFinalS"
        [finalS]="oaFinalT">
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
    ) {}

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
    [this.nwMatrix, this.nwFinalS, this.nwFinalT] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, {nw: true});
    [this.swMatrix, this.swFinalS, this.swFinalT] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, {sw: true});
    [this.oaMatrix, this.oaFinalS, this.oaFinalT] = this._sequenceAlignment.calculate(sequenceS, sequenceT, match, mismatch, gap, {oa: true});
  }
}

// enableProdMode();
bootstrap(App)
  .catch(err => console.error(err));