import { Component, OnInit, Input } from '@angular/core';

// copied from https://stackblitz.com/edit/angular-material-spinnerr-button

@Component({
  selector: 'app-spinner-button',
  templateUrl: './spinner-button.component.html',
  styleUrls: ['./spinner-button.component.scss']
})
export class SpinnerButtonComponent implements OnInit {
  @Input() spinner = false;
  @Input() color = 'primary';
  @Input() disabled = false;

  constructor() { }

  ngOnInit() {
  }

}
