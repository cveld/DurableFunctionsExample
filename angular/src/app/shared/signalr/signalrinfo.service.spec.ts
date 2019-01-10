import { TestBed } from '@angular/core/testing';

import { SignalrinfoService } from './signalrinfo.service';

describe('SignalrinfoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SignalrinfoService = TestBed.get(SignalrinfoService);
    expect(service).toBeTruthy();
  });
});
