import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'CSAPP';
  onMobile: Observable<BreakpointState>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public auth: AuthService
    ) { }

  ngOnInit(): void {
    this.onMobile = this.breakpointObserver.observe(['(max-width: 599px)']);
  }
}
