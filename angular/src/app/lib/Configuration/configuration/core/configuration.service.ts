import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ConfigurationService {
    private config: any;

    constructor(private http: HttpClient) {
    }
    /// Initializes the configuration service with configuration returned by the given url
    public load(configurationUrl: string): Promise<any> {
        // throw new Error('test the spinner');
        if (configurationUrl === undefined || configurationUrl === null) {
            throw new Error(`Argument cannot be null, argument name 'configurationUrl'.`);
        }
        if (configurationUrl.length === 0) {
            throw new Error(`Argument cannot be empty, argument name 'configurationUrl'.`);
        }
        const promise = this.http.get<any>(configurationUrl, { withCredentials: false }).toPromise();
        promise.then(config => {
            this.config = config;
        }).catch(() => {
            console.log('An error occured while loading configuration.');
            // throw new Error(`An error occured while loading configuration.`);
        });
        return promise;
    }

    /// Returns the value for the given key
    public getValue(key: string): any {
        if (key === undefined || key === null) {
            throw new Error(`Argument cannot be null, argument name 'key'.`);
        }
        if (key.length === 0) {
            throw new Error(`Argument cannot be empty, argument name 'key'.`);
        }
        if (!this.config) {
            throw new Error(
                `Attempted to access configuration property before configuration data was loaded, ` +
                `please make sure the ConfigurationModule is properly imported.`
            );
        }

        if (!this.config[key]) {
            throw new Error(
                `Required property ${key} was not defined within the configuration object. ` +
                `Please double check the result of your configation url.`
            );
        }

        return this.config[key];
    }
}
