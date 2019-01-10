import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowdemoComponent } from './workflowdemo.component';

describe('WorkflowdemoComponent', () => {
  let component: WorkflowdemoComponent;
  let fixture: ComponentFixture<WorkflowdemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowdemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowdemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
