import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GroupSummary } from 'src/app/shared/interfaces/group-summary.interface';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupService } from 'src/app/services/group/group.service';
import { take } from 'rxjs/operators';
import { UserService } from 'src/app/services/user/user.service';

export interface EditAdminData {
  action: 'create' | 'edit';
  uid: string;
  addGroups?: string[];
  removeGroups?: string[];
}

@Component({
  selector: 'app-edit-admin',
  templateUrl: './edit-admin.component.html',
  styleUrls: ['./edit-admin.component.css']
})
export class EditAdminComponent implements OnInit {

  groupsList: {[gid: string]: GroupSummary};
  adminForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditAdminComponent, EditAdminData>,
    @Inject(MAT_DIALOG_DATA) public data: EditAdminData,
    private fb: FormBuilder,
    private groups: GroupService,
    private users: UserService,
  ) {
    this.adminForm = fb.group({
      fullname   : [''],
      email      : ['', Validators.required],
      administra : [[]],
    });
  }


  ngOnInit(): void {
    // Get groupsList
    this.groups.observeGroupsList().pipe(take(1)).subscribe(list => this.groupsList = list);
    if (this.data.action === 'edit' && this.data.uid) {
      this.searchUserByUid(this.data.uid);
    }
  }

  private searchUserByUid(uid: string): void {
    this.users.getUser(uid).then(admin => {
      // Populate form fields
      if (admin) {
        this.adminForm.setValue({
          fullname   : admin.fName + ' ' + admin.lName,
          email      : admin.email,
          administra : admin.administra
        });
        this.data.removeGroups = admin.administra;
      } else {
        this.adminForm.get('fullname').setValue('User not found');
        this.adminForm.get('administra').setValue([]);
        this.data.removeGroups = [];
      }
    });
  }

  searchUserByEmail(email: string): void {
    this.users.getUserByEmail(email).then(admin => {
      // Populate form fields
      if (admin) {
        this.adminForm.setValue({
          fullname   : admin.fName + ' ' + admin.lName,
          email      : admin.email,
          administra : admin.administra
        });
        this.data.uid = admin.uid;
        this.data.removeGroups = admin.administra;
      } else {
        this.adminForm.get('fullname').setValue('User not found');
        this.adminForm.get('administra').setValue([]);
        this.data.uid = '';
        this.data.removeGroups = [];
      }
    });
  }

  onSubmit(): boolean {
    // Fail if some fields are invalid
    this.adminForm.markAsTouched();
    if (!this.adminForm.valid) { return false; }

    this.dialogRef.close({...this.data, addGroups: this.adminForm.get('administra').value});
    return false; // To avoid refreshing of page due to submit (because single-page application)
  }

  onClose(): void {
    this.dialogRef.close();
  }

}
