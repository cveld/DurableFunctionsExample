import { Component, OnInit } from '@angular/core';
import { EasyAuthService } from '../shared';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private easyAuthService: EasyAuthService) { }

  ngOnInit() {
  }

  easyAuthLogin(provider: string) {
    this.easyAuthService.redirectToLogin(provider, false);
  }
}
