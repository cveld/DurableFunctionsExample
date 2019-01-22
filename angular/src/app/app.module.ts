import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ConfigurationModule } from './lib/Uwv.eDv.Angular.Configuration/index';
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

@NgModule({
  declarations: [
    AppComponent,
    ErrorComponent,
    WorkflowdemoComponent,
    LoginbarComponent,
    AuthtesterComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule, MatCheckboxModule, MatToolbarModule, MatIconModule, MatListModule, MatProgressBarModule,
    MatSidenavModule, MatCardModule, MatSlideToggleModule,
    FlexLayoutModule,
    ConfigurationModule,
    // EasyAuthModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
