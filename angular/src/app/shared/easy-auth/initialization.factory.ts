import { EasyAuthService } from './easy-auth.service';
import { ActivatedRoute } from '@angular/router';

export function initializationFactory(easyAuthService: EasyAuthService, route: ActivatedRoute): any {
    route.fragment.subscribe((fragment: string) => {
        console.log('init: My hash fragment is here => ', fragment);
        const match = window.location.hash.match(/\btoken=([^&]+)/);
        if (match && match[1]) {
          const authToken = JSON.parse(decodeURIComponent(match[1])).authenticationToken;
          sessionStorage.setItem('authToken', authToken);
          history.pushState('', document.title, window.location.pathname + window.location.search);
        }
    });

    return () => {
        console.log('callback');
    };
}
