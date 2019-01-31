import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMapLayerComponent } from './my-map-layer.component';

describe('MyMapLayerComponent', () => {
  let component: MyMapLayerComponent;
  let fixture: ComponentFixture<MyMapLayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyMapLayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyMapLayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
