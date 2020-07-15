import { Injectable } from '@angular/core';
import {User} from '../../shared/interfaces/user.interface';
import {Router} from '@angular/router';
import { auth} from 'firebase/app';

// Firestore
import { AngularFireAuth} from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';

export interface AuthState {
  user: User;
  loggedIn: boolean;
  uid: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState$ = new BehaviorSubject<AuthState>({
    uid: null, roles: [], loggedIn: false, user: null
  });

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        // If login event detected, fetch user data and update state
        this.fetchUser(user.uid).then(data =>
          this.authState$.next( data ?
            {uid: data.uid, roles: data.roles, loggedIn: true, user: data} :
            {uid: data.uid, roles: [], loggedIn: true, user: null}
          )
        );
      } else {
        // If logout event detected, clear user data from state
        this.authState$.next({uid: null, roles: [], loggedIn: false, user: null});
      }
    });
  }

  /**
   * Creates an observable for the auth state of the application.
   * @return Observable that immediately returns the current auth state of the
   *         application and listens for changes
   */
  getAuthState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  /**
   * Gets the data of the user, either by fetching it from Firebase, or by
   * retrieving it from stored value (if available). If the user is not
   * authenticated, this function returns a promise that resolves to null.
   * @async
   * @param forceUpdate If true, forces the function to fetch a snapshot from
   *                    Firebase and updates  stored value (defaults to false)
   * @return            Promise that resolves to a snapshot of the user data
   * @throws            If user is not authenticated, throws 'User is not authenticated'
   */
  async getUser(forceUpdate = false): Promise<User> {
    // Validate that the user is authenticated
    if (!this.authState$.value.uid) { throw Error('User is not authenticated'); }

    return (!this.authState$.value.user || forceUpdate) ?
      this.fetchUser(this.authState$.value.uid) :
      this.authState$.value.user;
  }

  /**
   * Updates the data of the currently logged user in Firebase.
   * @async
   * @param  data Object with the fields to be updated in the User document
   * @return      Empty promise that resolves when user is updated
   * @throws      If user is not authenticated, throws rejected promise
   */
  async updateUser(data: Partial<User>): Promise<void> {
    // Validate that the user is authenticated
    if (!this.authState$.value.uid) { throw Error('User is not authenticated'); }

    return this.afs.doc<User>(`users/${this.authState$.value.uid}`).update(data);
  }

  /**
   * Opens a popup for the user to authenticate with the Google provider.
   * If this is a new user (hasn't signed in before), a new default user
   * profile is created in Firebase with the property isNewUser = true.
   * @async
   * @return Promise that returns the user data (if user exists) or the newly
   *         created user (if it didn't exist).
   * @throws Throws an catchable error if the user closes the authentication
   *         window without signing in.
   */
  async signinWithGoogle(): Promise<User> {
    const provider = new auth.GoogleAuthProvider()
                             .setCustomParameters({prompt: 'select_account'});

    const credential = await this.afAuth.signInWithPopup(provider);
    const authorization = credential.additionalUserInfo;

    // Wait until auth state is logged in
    console.log('Waiting for authState');
    const authState = await this.authState$.pipe(filter(state => state.loggedIn), take(1)).toPromise();
    console.log('End wait for authState');

    return authState.user ?
      // If user document was found, return the user
      authState.user :
      // If user document doesn't exist, create the user
      this.createUser(credential.user.uid, authorization.profile);
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
    if (!uid || !profile) { return new Promise(({}, reject) => reject('uid or profile not provided')); }

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
    return userRef.set(data)
                  .then(() => data, () => null)
                  .then(val => {
                    this.authState$.next({roles: data.roles, user: data, ...this.authState$.value});
                    return val;
                  });
  }

  /**
   * Fetches the data of a user from Firebase and returns a promise with the data.
   * @async
   * @param  uid     Id of the user to fetch (due to backend rules, can only be the
   *                 currently authenticated user or the call will fail)
   * @return         Promise that returns the newly created user's data
   */
  private fetchUser(uid: string): Promise<User> {
    // Check if uid was provided
    if (!uid) { return new Promise(({}, reject) => reject('uid not provided')); }

    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${uid}`);
    return userRef.get().pipe(
      map(doc => {
        // If the document exists, return promise with user data
        if (doc.exists) {
          const data = doc.data() as User;
          this.authState$.next({roles: data.roles, user: data, ...this.authState$.value});
          return data;
        }
        return null;
      })
    ).toPromise();
  }
}
