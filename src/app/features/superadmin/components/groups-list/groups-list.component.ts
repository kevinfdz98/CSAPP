import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupService } from 'src/app/services/group/group.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Group } from 'src/app/shared/interfaces/group.interface';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { majorsList } from 'src/app/shared/interfaces/major.interface';
import { EditGroupComponent, EditGroupData } from '../edit-group/edit-group.component';

interface GroupTableRow {
  gid: string;
  name: string;
  majors: string;
}

@Component({
  selector: 'app-groups-list',
  templateUrl: './groups-list.component.html',
  styleUrls: ['./groups-list.component.css']
})
export class GroupsListComponent implements OnInit, OnDestroy {

  subscriptions = new Subscription();
  columns: string[];
  data: GroupTableRow[] = [];
  onMobile: boolean;

  constructor(
    private auth: AuthService,
    private groups: GroupService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      // Subscribe to changes in screen size to change table columns
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer => {
                               this.onMobile = observer.matches;
                               this.columns = this.onMobile ? ['mobile'] : ['gid', 'name', 'majors']
                             })
    );
    this.subscriptions.add(
      // Wait until user is authenticated as superadmin ('sa')
      // and then subscribe to changes to GroupsList
      this.auth.observeAuthState()
              .pipe(filter(state => state.roles.includes('sa')), take(1))
              .subscribe(() => this.subscribeToGroupsListChanges())
    );
  }

  createGroupDialog(): void {
    const dialogRef = this.dialog.open(EditGroupComponent, {
      width: this.onMobile ? '100vw' : 'min-content',
      height: this.onMobile ? '100vh' : 'min-content',
      maxWidth: this.onMobile ? '100vw' : '80vw',
      maxHeight: this.onMobile ? '100vh' : '70vh',
      data: {action: 'create', group: null} as EditGroupData
    });

    dialogRef.afterClosed().subscribe((data: EditGroupData) => {
      if (data) { this.groups.createGroup(data.group as Group); }
    });
  }
  async editGroupDialog(gid): Promise<void> {
    const group = await this.groups.getGroup(gid);

    const dialogRef = this.dialog.open(EditGroupComponent, {
      width: this.onMobile ? '100vw' : 'min-content',
      height: this.onMobile ? '100vh' : 'min-content',
      maxWidth: this.onMobile ? '100vw' : '80vw',
      maxHeight: this.onMobile ? '100vh' : '70vh',
      data: {action: 'edit', group} as EditGroupData
    });

    dialogRef.afterClosed().subscribe((data: EditGroupData) => {
      if (data) { this.groups.updateGroup(gid, data.group); }
    });
  }

  subscribeToGroupsListChanges(): void {
    this.subscriptions.add(
      // Subscribe to changes to GroupsList (in Firebase) and build data array for table
      this.groups.observeGroupsList().subscribe(list => {
        this.data = Object.values(list).map(group => {
          const majors = [].concat(group.majorsTec20, group.majorsTec21);
          return {
            gid: group.gid,
            name: group.name,
            majors: majors.length > 0 ? majors.join(', ') : '-',
            color: (group.majorsTec21.length > 0) ? areasList.Tec21[majorsList.Tec21[group.majorsTec21[0]].area].color : 'black'
          };
        }).sort((a, b) => (a.gid === b.gid) ? 0 : (a.gid < b.gid) ? -1 : 1);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
