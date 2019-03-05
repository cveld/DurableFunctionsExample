import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ConfigurationModule, ConfigurationService } from './lib/Configuration';
import { MapModule, MapAPILoader, BingMapAPILoaderConfig, BingMapAPILoader, WindowRef, DocumentRef,
        MapServiceFactory, BingMapServiceFactory } from 'angular-maps';
import {
  MatAutocompleteModule,
  MatBadgeModule,
  MatBottomSheetModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDividerModule,
  MatExpansionModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatRippleModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatStepperModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule,
} from '@angular/material';
import { ErrorComponent } from './error/error.component';
import { WorkflowdemoComponent } from './workflowdemo/workflowdemo.component';
import { LoginbarComponent } from './loginbar/loginbar.component';
import { EasyAuthModule } from './shared/easy-auth/easy-auth.module';
import { AuthtesterComponent } from './authtester/authtester.component';
import { LoginComponent } from './login/login.component';
import { FlightsComponent } from './flights/flights.component';
import { FanoutComponent } from './fanout/fanout.component';
import { MyCanvasLayerDirective } from './my-map-layer/my-canvas-layer';
import { SpinnerButtonComponent } from './spinner-button/spinner-button.component';

@NgModule({
  declarations: [
    AppComponent,
    ErrorComponent,
    WorkflowdemoComponent,
    LoginbarComponent,
    AuthtesterComponent,
    LoginComponent,
    FanoutComponent
    FlightsComponent,
    MyCanvasLayerDirective,
    SpinnerButtonComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule, MatCheckboxModule, MatToolbarModule, MatIconModule, MatListModule, MatProgressBarModule,
    MatSidenavModule, MatCardModule, MatSlideToggleModule, MatProgressSpinnerModule,
    FlexLayoutModule,
    ConfigurationModule,
    MapModule.forRoot()
    // EasyAuthModule
  ],
  providers: [
      {
        provide: MapAPILoader, deps: [ConfigurationService], useFactory: MapServiceProviderFactory
      }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

// Example taken from https://stackblitz.com/edit/bing-map-with-canvas-marker
export function MapServiceProviderFactory(configurationService: ConfigurationService) {
    const bc: BingMapAPILoaderConfig = new BingMapAPILoaderConfig();
    bc.apiKey = configurationService.getValue('bingApiKey'); // your bing map key
    // bc.branch = "experimental";
        // to use the experimental bing branch. There are some bug fixes for
        // clustering in that branch you will need if you want to use
        // clustering.
    return new BingMapAPILoader(bc, new WindowRef(), new DocumentRef());
}
