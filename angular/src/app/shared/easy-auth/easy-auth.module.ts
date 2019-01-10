import { NgModule, APP_INITIALIZER } from '@angular/core';
import { initializationFactory } from './initialization.factory';
import { EasyAuthService } from './easy-auth.service';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@NgModule({
    imports: [
        HttpClientModule
    ],
    providers: [
        {
            'provide': APP_INITIALIZER,
            'useFactory': initializationFactory,
            'deps': [EasyAuthService],
            'multi': true
        },
        EasyAuthService
    ]
})

export class EasyAuthModule {
}
