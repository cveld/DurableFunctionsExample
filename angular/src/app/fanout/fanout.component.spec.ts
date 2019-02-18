import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FanoutComponent } from './fanout.component';

describe('FanoutComponent', () => {
  let component: FanoutComponent;
  let fixture: ComponentFixture<FanoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FanoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FanoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
