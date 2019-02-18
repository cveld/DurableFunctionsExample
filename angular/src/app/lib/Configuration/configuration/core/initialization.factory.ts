import { ConfigurationService } from './configuration.service';

/// Factory to start initialization for the configuration service
export function initializationFactory(config: ConfigurationService): any {
    const appElementName = 'app-root';
    const configUrlAttributeName = 'configurationurl';
    const errorUrlAttributeName = 'errorurl';
    const appElement = (<any>window).document.getElementsByTagName(appElementName)[0];
    const configUrl = appElement.attributes[configUrlAttributeName].value;
    const errorUrl = appElement.attributes[errorUrlAttributeName].value;
    const result = () => config.load(configUrl).catch(() => {
        // window.document.location.assign(errorUrl);
        history.pushState(null, null, errorUrl);
    });
    return result;
}
