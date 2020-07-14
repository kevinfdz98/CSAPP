import { Component, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { User } from 'src/app/shared/interfaces/user.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  showRegistrationForm = false;
  userData: User = null;

  constructor(
    public auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  signInWithGoogle(): void {
    this.auth.signinWithGoogle()
             .then(user => this.signinCallback(user));
  }

  private signinCallback(user: User): void {
    this.userData = user;
    this.showRegistrationForm = user !== null;
    if (!user) {
      this.router.navigateByUrl('/calendar');
    }
  }

  saveRegistrationData(event: any): void {
    this.showRegistrationForm = false;
    console.log('TODO: update User with => ', event);
    this.router.navigateByUrl('/calendar');
  }
}
