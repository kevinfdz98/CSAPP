import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { EditAdminComponent, EditAdminData } from '../edit-admin/edit-admin.component';

interface UserTableRow {
  uid: string;
  names: string;
  email: string;
  group: string;
}

@Component({
  selector: 'app-admins-list',
  templateUrl: './admins-list.component.html',
  styleUrls: ['./admins-list.component.css']
})
export class AdminsListComponent implements OnInit, OnDestroy {

  subscriptions = new Subscription();
  columns: string[];
  data: UserTableRow[] = [];

  constructor(
    private auth: AuthService,
    private users: UserService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      // Subscribe to changes in screen size to change table columns
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer =>
                               this.columns = observer.matches ? ['mobile', 'group'] : ['names',  'email', 'group']
                             )
    );
    this.subscriptions.add(
      // Wait until user is authenticated as superadmin ('sa')
      // and then subscribe to changes to AdminsList
      this.auth.observeAuthState()
              .pipe(filter(state => state.roles.includes('sa')), take(1))
              .subscribe(() => this.subscribeToAdminsListChanges())
    );
  }

  subscribeToAdminsListChanges(): void {
    this.subscriptions.add(
      // Subscribe to changes to AdminsList (in Firebase) and build data array for table
      this.users.observeAdminsList().subscribe(list =>
        this.data = Object.values(list).reduce(
          (arr, admin) => arr.concat( (admin.administra.length > 0) ?
            admin.administra.map(gid => ({uid: admin.uid, names: `${admin.fName} ${admin.lName}`, email: admin.email, group: gid})) :
            [{uid: admin.uid, names: `${admin.fName} ${admin.lName}`, email: admin.email, group: '-'}]
          ), [] as UserTableRow[]
        )
      )
    );
  }

  editAdminsDialog(uid?: string): void {
    const dialogRef = this.dialog.open(EditAdminComponent, {
      width: '250px',
      data: {action: uid ? 'edit' : 'create', uid} as EditAdminData
    });

    dialogRef.afterClosed().subscribe((data: EditAdminData) => {
      console.log(data);
      if (data && data.uid && data.uid.length > 0) {
        this.users.updateGroups(data.uid, data.removeGroups, data.addGroups);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
