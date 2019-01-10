import { Injectable } from '@angular/core';
import * as jwtDecode from 'jwt-decode';

interface TokenDto {
    foo: string;
    exp: number;
    iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {

    constructor() { }

    getTokenExpirationDate(token: string): Date {
        const decoded = jwtDecode<TokenDto>(token);

        if (decoded.exp === undefined) {
            return null;
        }

        const date = new Date(0);
        date.setUTCSeconds(decoded.exp);
        return date;
    }

    isTokenExpired(token?: string): boolean {
        if (!token) { return true; }

        const date = this.getTokenExpirationDate(token);
        if (date === undefined) { return false; }
        return !(date.valueOf() > new Date().valueOf());
    }

}
