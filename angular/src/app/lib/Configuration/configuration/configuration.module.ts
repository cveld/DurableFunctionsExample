import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ConfigurationService } from './core/configuration.service';
import { initializationFactory } from './core/initialization.factory';

/// Configuration module, takes care that exposes and initializes the configuraton service
@NgModule({
    imports: [
        HttpClientModule
    ],
    providers: [
        {
            'provide': APP_INITIALIZER,
            'useFactory': initializationFactory,
            'deps': [ConfigurationService],
            'multi': true
        },
        ConfigurationService
    ]
})

export class ConfigurationModule {
}
