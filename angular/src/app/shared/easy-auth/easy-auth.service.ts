import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from '../../lib/Configuration';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../token/token.service';
import { tap, map } from 'rxjs/operators';

@Injectable({
   providedIn: 'root'
})
export class EasyAuthService {
    apiBaseUrl: string;
    authToken: string;
    meData: any;

    constructor(
        private http: HttpClient,
        private configurationService: ConfigurationService,
        private route: ActivatedRoute,
        private router: Router,
        private tokenService: TokenService
    ) {
        try {
            this.apiBaseUrl = this.configurationService.getValue('functionsApp');
        } catch (e) {
            console.error(e);
        }

        this.authToken = sessionStorage.getItem('authToken');

        this.route.fragment.subscribe((fragment: string) => {
            const match = window.location.hash.match(/\btoken=([^&]+)/);
            if (match && match[1]) {
              this.authToken = JSON.parse(decodeURIComponent(match[1])).authenticationToken;
              console.log(`Token extracted from incoming url fragment: ${this.authToken}`);
              sessionStorage.setItem('authToken', this.authToken);
              history.pushState('', document.title, window.location.pathname + window.location.search);
            }
        });

    }

    setAuthToken(token: string) {
        this.authToken = token;
        sessionStorage.setItem('authToken', token);
    }

    validAuthToken(): boolean {
        return !!this.authToken && !this.tokenService.isTokenExpired(this.authToken);
    }

    getAuthToken(checkExpired: boolean = true, redirectToLogin: boolean = true): Promise<string> {
        if (!this.authToken) {
            this.authToken = sessionStorage.getItem('authToken');
        }
        if (this.authToken) {
            if (!checkExpired || !this.tokenService.isTokenExpired(this.authToken)) {
                return Promise.resolve(this.authToken);
            }
            return this.refreshToken().catch((reason) => {
                console.log('Refresh token failed: ', reason);
                return this.getAuthTokenContinuation(redirectToLogin);
            });
        }

        return this.getAuthTokenContinuation(redirectToLogin);
    }

    private getAuthTokenContinuation(redirectToLogin: boolean): Promise<string> {
        if (redirectToLogin) {
            return new Promise<string>((resolve, reject) => {
                this.router.navigateByUrl('/login');
            });
        }

        return Promise.resolve(null);
    }

    removeToken(): any {
        sessionStorage.removeItem('authToken');
        this.authToken = undefined;
    }

    refreshToken(): Promise<string> {
        return this.getAuthToken(false)
            .then((token: string) => {
                const headers = new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-ZUMO-AUTH': token
                    // 'Authorization': `Bearer ${token}`
                });
            return this.http.post<any>(`${this.apiBaseUrl}/.auth/refresh`, null, { headers: headers }).toPromise();
          })
          .then((data: { authenticationToken: string }) => {
                // this.messages.push(`Durable: ${data.statusQueryGetUri}`);
                console.log(`New authToken: ${data.authenticationToken}`);
                this.setAuthToken(data.authenticationToken);
                return data.authenticationToken;
        });
        // return this.http.get(`${this.apiBaseUrl}/.auth/refresh`).toPromise();
    }

    async getMeData(): Promise<any> {
        const token = await this.getAuthToken(true);
        const url = `${this.apiBaseUrl}/.auth/me`;
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'X-ZUMO-AUTH': token
            // 'Authorization': `Bearer ${token}`
        });
        const data = await this.http.get(url, { headers: headers }).toPromise();
        this.meData = data;
        return data;
    }

    redirectToLogin(provider: string, signup: boolean) {
        window.location.href =
        `${this.apiBaseUrl}/.auth/login/${provider}?${signup ? 'prompt=consent&' : ''}session_mode=token&post_login_redirect_url=` +
          encodeURIComponent(window.location.origin);
    }
}
