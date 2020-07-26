import { Component, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { User } from 'src/app/shared/interfaces/user.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { RegistrationFormComponent, RegistrationData } from './components/registration-form/registration-form.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  subscriptions = new Subscription();
  onMobile: boolean;

  constructor(
    public auth: AuthService,
    private router: Router,
    private snack: MatSnackBar,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      // Subscribe to changes in screen size to change table columns
      this.breakpointObserver.observe(['(max-width: 599px)'])
                             .subscribe(observer => {
                               this.onMobile = observer.matches;
                             })
    );
  }

  signInWithGoogle(): void {
    this.auth.signinWithGoogle()
             .then(user => this.signinCallback(user))
             .catch(err => this.openSnack(`Error during login: ${err}`, 'ok :(', 2000));
  }

  private openSnack(message: string, action: string, ms: number): void {
    this.snack.open(message, action, {
      duration: ms,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private signinCallback(user: User): void {
    this.openSnack(`Bienvenid@ ${user.fName} ${user.lName}`, 'Nice!', 2000);

    if (user) {
      if (user.isNewUser) {
        this.registrationDialog(user);
      } else {
        this.router.navigateByUrl('/calendar');
      }
    }
  }

  registrationDialog(user: User): void {
    const dialogRef = this.dialog.open(RegistrationFormComponent, {
      width: this.onMobile ? '100vw' : 'min-content',
      height: this.onMobile ? '100vh' : 'min-content',
      maxWidth: this.onMobile ? '100vw' : '80vw',
      maxHeight: this.onMobile ? '100vh' : '70vh',
      data: {userData: {...user}, saveData: null} as RegistrationData
    });

    dialogRef.afterClosed().subscribe((data: RegistrationData) => {
      if (data && data.saveData) {
        this.openSnack('Cambios guardados', 'Nice!', 1000);
        this.auth.updateUser({...data.saveData, isNewUser: false}).then(() => {
          this.router.navigateByUrl('/calendar');
        }).catch(err => console.error(err));
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
