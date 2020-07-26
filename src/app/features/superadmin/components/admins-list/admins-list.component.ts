import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { filter, take, map } from 'rxjs/operators';
import { Subscription, Observable, of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { EditAdminComponent, EditAdminData } from '../edit-admin/edit-admin.component';
import { GroupService } from 'src/app/services/group/group.service';
import { GroupSummary } from 'src/app/shared/interfaces/group-summary.interface';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { majorsList } from 'src/app/shared/interfaces/major.interface';

interface UserTableRow {
  uid: string;
  names: string;
  email: string;
  group: string;
  color: Observable<string>;
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
  groupsList: {[uid: string]: GroupSummary};
  onMobile: boolean;

  constructor(
    private auth: AuthService,
    private userS: UserService,
    private groupS: GroupService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      // Subscribe to changes in screen size to change table columns
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer => {
                               this.onMobile = observer.matches;
                               this.columns = this.onMobile ? ['mobile', 'group'] : ['names',  'email', 'group'];
                             })
    );
    this.subscriptions.add(
      // Wait until user is authenticated as superadmin ('sa')
      // and then subscribe to changes to AdminsList
      this.auth.observeAuthState()
              .pipe(filter(state => state.roles.includes('sa')), take(1))
              .subscribe(() => {
                this.subscribeToAdminsListChanges();
              })
    );
  }

  getGroupColor(gid: string): Observable<string> {
    return this.groupS.observeGroupsList().pipe(
      map(list => (list[gid] && list[gid].majorsTec21[0]) ? list[gid].majorsTec21[0] : null),
      map(mid => mid ? majorsList.Tec21[mid].area : null),
      map(aid => aid ? areasList.Tec21[aid].color : 'black')
    );
  }

  subscribeToAdminsListChanges(): void {
    this.subscriptions.add(
      // Subscribe to changes to AdminsList (in Firebase) and build data array for table
      this.userS.observeAdminsList().subscribe(list =>
        this.data = Object.values(list).reduce(
          (arr, admin) => arr.concat( (admin.administra.length > 0) ?
            admin.administra.map(gid => ({
              uid: admin.uid,
              names: `${admin.fName} ${admin.lName}`,
              email: admin.email,
              group: gid,
              color: this.getGroupColor(gid),
          })) : [{uid: admin.uid, names: `${admin.fName} ${admin.lName}`, email: admin.email, group: '-', color: of('black')}]
          ), [] as UserTableRow[]
        ).sort((a, b) => {
          if (a.group === b.group) {
            return (a.email === b.email) ? 0 : (a.email < b.email) ? -1 : 1;
          }
          return (a.group < b.group) ? -1 : 1;
        })
      )
    );
  }

  editAdminsDialog(uid?: string): void {
    const dialogRef = this.dialog.open(EditAdminComponent, {
      width: this.onMobile ? '100vw' : 'min-content',
      height: this.onMobile ? '100vh' : 'min-content',
      maxWidth: this.onMobile ? '100vw' : '80vw',
      maxHeight: this.onMobile ? '100vh' : '70vh',
      data: {action: uid ? 'edit' : 'create', uid} as EditAdminData
    });

    dialogRef.afterClosed().subscribe((data: EditAdminData) => {
      if (data && data.uid && data.uid.length > 0) {
        this.userS.updateGroups(data.uid, data.removeGroups, data.addGroups);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
