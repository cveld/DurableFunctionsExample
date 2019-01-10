import { TestBed } from '@angular/core/testing';

import { EasyAuthService } from './easy-auth.service';

describe('EasyAuthService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EasyAuthService = TestBed.get(EasyAuthService);
    expect(service).toBeTruthy();
  });
});
