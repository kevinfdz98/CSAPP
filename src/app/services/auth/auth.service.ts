import { Injectable } from '@angular/core';
import {User} from '../../shared/interfaces/user.interface';
import {Router} from '@angular/router';
import { auth} from 'firebase/app';

// Firestore
import { AngularFireAuth} from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { BehaviorSubject, Subscription} from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private subscriptionToUser: Subscription = new Subscription();
  user$: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  uid$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.afAuth.onAuthStateChanged(user => {
      if (user) {
        this.subscriptionToUser.add(
          this.afs.doc<User>(`users/${user.uid}`)
                  .valueChanges()
                  .subscribe(this.user$)
        );
        this.uid$.next(user.uid);
      } else {
        this.subscriptionToUser.unsubscribe();
        this.user$.next(null);
        this.uid$.next(null);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.uid$.value !== null;
  }

  async signinWithGoogle(): Promise<User> {
    const provider = new auth.GoogleAuthProvider()
                             .setCustomParameters({prompt: 'select_account'});

    const credential = await this.afAuth.signInWithPopup(provider);
    const authorization = credential.additionalUserInfo;
    const userData = (authorization.isNewUser) ?
        await this.createUser(credential.user.uid, authorization.profile) :
        await this.getUserData(credential.user.uid);

    this.user$.next(userData);
    return userData;
  }

  async signOut(): Promise<boolean> {
    await this.afAuth.signOut();
    return this.router.navigate(['/']);
  }

  private createUser(uid: string, profile: any): Promise<User> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${uid}`);
    const data: User = {
      uid,
      fName     : profile.given_name,
      lName     : profile.family_name,
      email     : profile.email,
      roles     : ['u'],
      following : [],
      isNewUser : true,
    };
    // Return promise with user data if success, else return null promise
    return userRef.set(data).then(() => data, () => null);
  }

  private getUserData(uid: string): Promise<User> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${uid}`);
    return userRef.get().pipe(
      map(doc => {
        // If the document exists, return promise with user data
        if (doc.exists) {
          return doc.data() as User;
        }
        // else, return null promise
        return null;
      })
    ).toPromise();
  }
}
