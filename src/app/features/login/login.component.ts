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
             .then(user => this.signinCallback(user))
             .catch(err => console.log(`Error: ${err}`));
  }

  private signinCallback(user: User): void {
    this.userData = user;
    this.showRegistrationForm = (user && user.isNewUser);
    if (user && !user.isNewUser) {
      this.router.navigateByUrl('/calendar');
    }
  }

  saveRegistrationData(event: Partial<User>): void {
    this.auth.updateUser({isNewUser: false, ...event}).then(() => {
      this.showRegistrationForm = false;
      this.router.navigateByUrl('/calendar');
    }).catch(err => console.log(`Error: ${err}`));
  }
}
