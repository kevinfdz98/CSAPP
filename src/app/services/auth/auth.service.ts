import { Injectable } from '@angular/core';
import {User} from '../../shared/interfaces/user.interface';
import {Router} from '@angular/router';
import { auth} from 'firebase/app';

// Firestore
import { AngularFireAuth} from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private uid$ = new BehaviorSubject<string>(null);

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.afAuth.authState.subscribe(user =>
      this.uid$.next(user ? user.uid : null)
    );
  }

  /**
   * Creates an observable for the user id of the currently logged in user.
   * @return Observable that immediately returns the uid of the current user
   *         (or null, if not signed in) and listens to changes in auth state
   */
  getUid(): Observable<string> {
    return this.uid$.asObservable();
  }

  /**
   * Creates an observable for whether the user is logged in.
   * @return Observable that immediately returns whether the user is logged in
   *         and listens to changes in auth state
   */
  getLoggedIn(): Observable<boolean> {
    return this.uid$.asObservable().pipe(
      map(uid => uid !== null)
    );
  }

  /**
   * Promise that fetches the data of current user from Firebase.
   * @async
   * @return Promise that resolves to a snapshot of the current user data
   */
  getUser(): Promise<User> {
    return this.getUserData(this.uid$.value);
  }

  /**
   * Opens a popup for the user to authenticate with the Google provider.
   * If this is a new user (hasn't signed in before), a new default user
   * profile is created in Firebase with the property isNewUser = true.
   * @async
   * @return Promise that returns the user data (if user exists) or the newly
   *         created user (if it didn't exist).
   */
  async signinWithGoogle(): Promise<User> {
    const provider = new auth.GoogleAuthProvider()
                             .setCustomParameters({prompt: 'select_account'});

    const credential = await this.afAuth.signInWithPopup(provider);
    const authorization = credential.additionalUserInfo;
    return (authorization.isNewUser) ?
        await this.createUser(credential.user.uid, authorization.profile) :
        await this.getUserData(credential.user.uid);
  }

  /**
   * Signs out the current user and navigates the router to the root route if successful
   * @async
   * @return Promise that returns whether the signout was successful
   */
  async signout(): Promise<boolean> {
    return this.afAuth.signOut().then(() =>
      this.router.navigate(['/'])
    );
  }

  /**
   * Creates a new user in Firebase parsing the information from the profile returned by the
   * provider during sign in. Uses a regex to determine if the email is from a Tec student
   * and parses their matricula from it.
   * @async
   * @param  uid     Id if the user to fetch (due to backend rules, can only be the currentle
   *                 authenticated user or the call will fail)
   * @param  profile The profile returned by the provider used to sign in
   * @return         Promise that returns the newly created user's data
   */
  private createUser(uid: string, profile: any): Promise<User> {
    // Check if uid was provided
    if (!uid) { return new Promise(null); }

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
    // Check if email is of a tec student (Axxxxxxx@itesm.mx o axxxxxxx@itesm.mx)
    if (/[aA]\d{8}@itesm.mx/.test(data.email)) {
      data.matricula = data.email.substr(0, 9).toUpperCase();
    }
    // Return promise with user data if success, else return null promise
    return userRef.set(data).then(() => data, () => null);
  }

  /**
   * Creates a new user in Firebase parsing the information from the profile returned by the
   * provider during sign in. Uses a regex to determine if the email is from a Tec student
   * and parses their matricula from it.
   * @async
   * @param  uid     Id if the user to fetch (due to backend rules, can only be the currentle
   *                 authenticated user or the call will fail)
   * @return         Promise that returns the newly created user's data
   */
  private getUserData(uid: string): Promise<User> {
    // Check if uid was provided
    if (!uid) { return new Promise(null); }

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
