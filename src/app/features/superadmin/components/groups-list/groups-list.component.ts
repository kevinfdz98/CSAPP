import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupService } from 'src/app/services/group/group.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { filter, take } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BreakpointState, BreakpointObserver } from '@angular/cdk/layout';

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
  onMobile = new BehaviorSubject<BreakpointState>({matches: false, breakpoints: {}});
  columns: string[];
  data: GroupTableRow[] = [];

  constructor(
    private auth: AuthService,
    private groups: GroupService,
    private breakpointObserver: BreakpointObserver,
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer =>
                               this.columns = observer.matches ? ['mobile'] : ['gid', 'name', 'majors']
                             )
    );
    this.subscriptions.add(
        this.auth.getAuthState().pipe(
        filter(state => state.roles.includes('sa')),
        take(1)
      ).subscribe(state => this.fetchData())
    );
  }

  fetchData(): void {
    this.groups.getGroupList(true).then(listObj =>
      this.data = this.data.concat(Object.values(listObj).reduce((arr, group) => arr.concat(
        [{gid: group.gid, name: group.name, majors: group.majors.join(', ')}]
      ), [] as GroupTableRow[])
    ));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
