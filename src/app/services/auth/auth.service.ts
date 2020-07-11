import { Injectable } from '@angular/core';
import {User} from '../../shared/interfaces/user.interface';
import {Router} from '@angular/router';
import { auth} from 'firebase/app';

// Firestore
import { AngularFireAuth} from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { Observable, of} from 'rxjs';
import { switchMap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User>;
  loggedIn: boolean;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
            if (user) {
              this.loggedIn = true;
              return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
            } else {
              this.loggedIn = false;
              return of(null);
            }
      })
    );
  }

  async googleSignin(): Promise <any> {
    const provider = new auth.GoogleAuthProvider();
    const credential = await this.afAuth.signInWithPopup(provider);
    const authorization = credential.additionalUserInfo;
    const profile = authorization.profile;

    console.log('Provider', provider);
    console.log('credential', credential);
    console.log('authorization', authorization);
    console.log('profile', profile);

    if (authorization.isNewUser)
    {
      return this.registerUserData(credential.user, profile);
    }
    else
    {
      return this.getUserData(credential.user);
    }
  }

  async signOut(): Promise<boolean> {
    await this.afAuth.signOut();
    this.loggedIn = false;
    return this.router.navigate(['/']);
  }

  private registerUserData(user, profile): Promise<void> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);
    const data = {
       uid   : user.uid,
       fName : profile.given_name,
       lName : profile.family_name,
       email : profile.email,
       roles : [],
       major : '',
       following : []
    };
    this.loggedIn = true;
    return userRef.set(data);
  }

  private getUserData(profile): Observable<any> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${profile.uid}`);
    this.loggedIn = true;
    return userRef.get();
  }
}
