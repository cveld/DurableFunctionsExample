import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigurationService } from './configuration.service';

describe('Configuration Service', () => {
    let service: ConfigurationService;
    let httpMock: HttpTestingController;
    const testConfigurationUrl = 'http://test.configuration.url';
    const testKey = 'testKey';
    const testValue = 'testValue';
    const testConfiguration: any = {
        testKey: testValue
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule
            ],
            providers: [ConfigurationService]
        });
        httpMock = TestBed.get(HttpTestingController);
        service = TestBed.get(ConfigurationService);
    });

    describe('load logic', () => {
        it('should throw error when configurationUrl is null', () => {
            expect(function () { service.load(null); })
                .toThrowError(/(.)*argument cannot be null(.)*configurationUrl(.)*/i);
        });

        it('should throw error when configurationUrl is empty', () => {
            expect(function () { service.load(''); })
                .toThrowError(/(.)*argument cannot be empty(.)*configurationUrl(.)*/i);
        });

        it('should throw error when the call to configurationUrl fails', fakeAsync(() => {
            service.load(testConfigurationUrl);
            const request = httpMock.expectOne(testConfigurationUrl);
            request.flush('', { status: 500, statusText: 'Internal server error' });
            expect(function () { tick(); }).toThrowError(/(.)*error occured while loading configuration(.)*/i);
            httpMock.verify();
        }));

        it('should call the configurationUrl and set config', fakeAsync(() => {
            service.load(testConfigurationUrl);
            const request = httpMock.expectOne(testConfigurationUrl);
            request.flush(testConfiguration);
            tick();
            expect(service.getValue(testKey)).toBe(testValue);
            httpMock.verify();
        }));
    });

    describe('getValue logic while not initialzed', () => {
        it('should throw error when key is not defined', () => {
            expect(function () { service.getValue(null); })
                .toThrowError(/(.)*argument cannot be null(.)*key(.)*/i);
        });

        it('should throw error when key is empty', () => {
            expect(function () { service.getValue(''); })
                .toThrowError(/(.)*argument cannot be empty(.)*key(.)*/i);
        });

        it('should throw error when configuration is not initialized', () => {
            expect(function () { service.getValue(testKey); })
                .toThrowError(
                    'Attempted to access configuration property before configuration data was loaded, ' +
                    'please make sure the ConfigurationModule is properly imported.'
                );
        });

    });

    describe('getValue logic while initialzed', () => {
        beforeEach(fakeAsync(() => {
            service.load(testConfigurationUrl);
            const request = httpMock.expectOne(testConfigurationUrl);
            request.flush(testConfiguration);
            tick();
        }));

        it('should throw error when key does not exist', () => {
            expect(function () { service.getValue('nonExistingKey'); })
                .toThrowError(
                    'Required property nonExistingKey was not defined within the configuration object. ' +
                    'Please double check the result of your configation url.'
                );
        });

        it('should return the configured value', () => {
            expect(service.getValue(testKey)).toBe(testValue);
        });
    });
});
