import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import { TextDialogComponent } from './components/text-dialog/text-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ONE POINT';
  onMobile = new BehaviorSubject<BreakpointState>({matches: false, breakpoints: {}});
  loggedIn: Observable<boolean>;
  isSuperadmin: Observable<boolean>;
  administraList: Observable<string[]>;
  @ViewChild('drawer') sidenav: MatSidenav;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    public activated: ActivatedRoute
    ) { }

  ngOnInit(): void {
    this.loggedIn = this.auth.observeAuthState().pipe(map(state => state.loggedIn));
    this.isSuperadmin = this.auth.observeAuthState().pipe(map(state => state.roles.includes('sa')));
    this.administraList = this.auth.observeAuthState().pipe(map(state => (state.user) ? state.user.administra : []));
    this.breakpointObserver.observe(['(max-width: 599px)'])
                           .subscribe(this.onMobile);
    this.router.events.subscribe(event => {
      // If on mobile, close sidenav on navigation
      if (this.onMobile.value.matches) { this.sidenav.close(); }
    });
  }

  ngAfterViewInit(): void {
    this.openTextDialog();
  }

  openTextDialog(): void {
    const dialogRef = this.dialog.open(TextDialogComponent, {
      width: this.onMobile.value.matches ? '100vw' : '400px',
      height: this.onMobile.value.matches ? '100vh' : 'min-content',
      maxWidth: this.onMobile.value.matches ? '100vw' : '80vw',
      maxHeight: this.onMobile.value.matches ? '100vh' : '70vh'
    });
  }

}
