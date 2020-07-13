import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  subscriptionToUser: Subscription;
  showRegistrationForm = false;

  constructor(
    public auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to changes in user (log in or log out)
    this.subscriptionToUser = this.auth.user$.subscribe(user => {
      this.showRegistrationForm = user ? user.isNewUser : false;
      if (user && !user.isNewUser) {
        this.router.navigateByUrl('/calendar');
      }
    });
  }

  signInWithGoogle(): void {
    this.auth.signinWithGoogle().then(user => {
      if (!user) {
        this.showRegistrationForm = false;
        alert('Something went wrong during sign in');
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptionToUser.unsubscribe();
  }
}
