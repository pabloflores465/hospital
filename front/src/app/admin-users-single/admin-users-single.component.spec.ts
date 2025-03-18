import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUsersSingleComponent } from './admin-users-single.component';

describe('AdminUsersSingleComponent', () => {
  let component: AdminUsersSingleComponent;
  let fixture: ComponentFixture<AdminUsersSingleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersSingleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUsersSingleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
