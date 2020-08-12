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
import { UserService } from 'src/app/services/user/user.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

interface GroupTableRow {
  gid: string;
  name: string;
  majors: string;
  subscribed: boolean;
}

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.css']
})
export class FollowingComponent implements OnInit, OnDestroy {

  subscriptions = new Subscription();
  columns: string[];
  data: GroupTableRow[] = [];
  onMobile: boolean;
  following: string[] = [];

  constructor(
    private auth: AuthService,
    private groups: GroupService,
    private users: UserService,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      // Subscribe to changes in screen size to change table columns
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer => {
                               this.onMobile = observer.matches;
                               this.columns = this.onMobile ? ['mobile', 'toggle'] : ['gid', 'name', 'majors', 'toggle']
                             })
    );
    this.subscriptions.add(
      // Wait until user is authenticated as superadmin ('sa')
      // and then subscribe to changes to GroupsList
      this.auth.observeAuthState()
              .subscribe(state => this.following = [...state.user.following])
    );
    this.subscriptions.add(
      // Wait until user is authenticated as superadmin ('sa')
      // and then subscribe to changes to GroupsList
      this.auth.observeAuthState()
              .pipe(filter(state => state.roles.includes('u')), take(1))
              .subscribe(() => this.subscribeToGroupsListChanges())
    );
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
            color: (group.majorsTec21.length > 0) ? areasList.Tec21[majorsList.Tec21[group.majorsTec21[0]].area].color : 'black',
            subscribed:  this.following.includes(group.gid),
          };
        }).sort((a, b) => (a.gid === b.gid) ? 0 : (a.gid < b.gid) ? -1 : 1);
      })
    );
  }

  toggleSubscription(event: MatSlideToggleChange, group: GroupTableRow): void {
    console.log(event, group);
    this.users.updateSubscriptions(
      event.checked ? [] : [group.gid],
      event.checked ? [group.gid] : []
    );
  }

  doSomething(gid: string): void {
    this.router.navigate(['groups', gid]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
