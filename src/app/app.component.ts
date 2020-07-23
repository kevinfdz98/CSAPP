import { Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'CSAPP';
  onMobile = new BehaviorSubject<BreakpointState>({matches: false, breakpoints: {}});
  loggedIn: Observable<boolean>;
  isSuperadmin: Observable<boolean>;
  administraList: Observable<string[]>;
  @ViewChild('drawer') sidenav: MatSidenav;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public auth: AuthService,
    private router: Router
    ) { }

  ngOnInit(): void {
    this.loggedIn = this.auth.observeAuthState().pipe(map(state => state.loggedIn));
    this.isSuperadmin = this.auth.observeAuthState().pipe(map(state => state.roles.includes('sa')));
    this.administraList = this.auth.observeAuthState().pipe(map(state => (state.user)? state.user.administra : []));
    this.breakpointObserver.observe(['(max-width: 599px)'])
                           .subscribe(this.onMobile);
  }

  navigateByUrl(url: string): void {
    // Navigate to url
    this.router.navigateByUrl(url);
    // If on mobile, close sidenav on click
    if (this.onMobile.value.matches) {
      this.sidenav.close();
    }
  }

}
