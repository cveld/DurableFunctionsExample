import { Component, OnInit } from '@angular/core';
import { EasyAuthService } from '../shared';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from '../lib/Uwv.eDv.Angular.Configuration';

@Component({
  selector: 'app-authtester',
  templateUrl: './authtester.component.html',
  styleUrls: ['./authtester.component.scss']
})
export class AuthtesterComponent implements OnInit {
    tokens: Array<any> = new Array<any>();
    baseurl: string;

    constructor(
        private easyAuth: EasyAuthService,
        private http: HttpClient,
        private configuration: ConfigurationService
    ) { }

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
                // 'X-ZUMO-AUTH': token
                'Authorization': `Bearer ${token}`
            });
            this.http.get(`${this.baseurl}/api/ClaimsPrincipalTest?code=X3LfEnLHBd9ozNPGNtlA6vcDNFDU3ODMzqAqJ2XMBKQU2BYvuYssuw==`, { headers: headers }).toPromise().then(data => {
                this.tokens.push(data);
            });
        });
    }
}
