import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { filter, take } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BreakpointState, BreakpointObserver } from '@angular/cdk/layout';

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
  onMobile = new BehaviorSubject<BreakpointState>({matches: false, breakpoints: {}});
  columns: string[];
  data: UserTableRow[] = [];

  constructor(
    private auth: AuthService,
    private users: UserService,
    private breakpointObserver: BreakpointObserver,
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer =>
                               this.columns = observer.matches ? ['mobile', 'group'] : ['names',  'email', 'group']
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
    this.users.getAdminList(true).then(listObj =>
      this.data = Object.values(listObj).reduce((arr, user) => arr.concat( (user.administra.length > 0) ?
        user.administra.map(gid => ({uid: user.uid, names: `${user.fName} ${user.lName}`, email: user.email, group: gid})) :
        [{uid: user.uid, names: `${user.fName} ${user.lName}`, email: user.email, group: '-'}]
      ), [] as UserTableRow[])
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
