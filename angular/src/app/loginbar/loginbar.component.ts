import { Component, OnInit } from '@angular/core';
import { ConfigurationService } from '../lib/Uwv.eDv.Angular.Configuration';
import { EasyAuthService } from '../shared';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loginbar',
  templateUrl: './loginbar.component.html',
  styleUrls: ['./loginbar.component.scss']
})
export class LoginbarComponent implements OnInit {
    username: string;
    apiBaseUrl: string;

    constructor(
        private configurationService: ConfigurationService,
        private easyAuthService: EasyAuthService,
        private router: Router
    ) {
    }

    loggedin(): boolean {
        return !!this.easyAuthService.authToken;
    }

    logoutClicked() {
        this.easyAuthService.removeToken();
        this.username = undefined;
        sessionStorage.removeItem('username');
    }

    // this lifecycle of the username property only works as the current login flow always triggers a refresh of the complete app
    ngOnInit() {
        if (this.loggedin() && !this.username) {
            this.username = sessionStorage.getItem('username');
            if (!this.username) {
                this.easyAuthService.getMeData().then(data => {
                    this.username = data[0].user_claims.find(a => a.typ === 'name').val;
                    sessionStorage.setItem('username', this.username);
                });
            }
        }
    }

    loginAADClicked() {
        this.easyAuthService.redirectToLogin('aad', false);
    }

    loginMicrosoftClicked() {
        this.easyAuthService.redirectToLogin('microsoftaccount', false);
    }

    loginClicked() {
        this.router.navigateByUrl('/login');
    }

}
