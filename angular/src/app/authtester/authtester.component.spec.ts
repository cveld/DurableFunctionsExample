import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthtesterComponent } from './authtester.component';

describe('AuthtesterComponent', () => {
  let component: AuthtesterComponent;
  let fixture: ComponentFixture<AuthtesterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthtesterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthtesterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
