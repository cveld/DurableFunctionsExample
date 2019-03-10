import { Component, OnInit } from '@angular/core';
import { EasyAuthService } from '../shared';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from '../lib/Configuration';
import { MatSlideToggleChange } from '@angular/material';

@Component({
  selector: 'app-authtester',
  templateUrl: './authtester.component.html',
  styleUrls: ['./authtester.component.scss']
})
export class AuthtesterComponent implements OnInit {
    tokens: Array<any> = new Array<any>();
    baseurl: string;
    showTokens = false;

    constructor(
        public easyAuth: EasyAuthService,
        private http: HttpClient,
        private configuration: ConfigurationService
    ) { }

    onSlideToggleChange($event: MatSlideToggleChange) {
        this.showTokens = $event.checked;
    }

    ngOnInit() {
        this.baseurl = this.configuration.getValue('functionsApp');
    }

    refreshToken() {
        this.easyAuth.refreshToken().then(token => {
            this.tokens.push(token);
        });
    }

    getMeData() {
        this.easyAuth.getMeData().then(data => {
            this.tokens.push(data);
        });
    }

    authTesterClicked() {
        this.easyAuth.getAuthToken().then(token => {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                // EasyAuth uses a proprietary token header:
                'X-ZUMO-AUTH': token
                // the oauth way is not the way EasyAuth works. Therefore the following will give you access denied:
                // 'Authorization': `Bearer ${token}`
            });
            const code = this.configuration.getValue('functionsAppCode');
            // tslint:disable-next-line:max-line-length
            this.http.get(`${this.baseurl}/api/ClaimsPrincipalTestInjectedAnonymous?code=${code}`, { headers: headers }).toPromise().then(data => {
                this.tokens.push(data);
            });
        });
    }
}
