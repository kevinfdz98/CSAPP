import { Injectable } from '@angular/core';
import {User} from '../../shared/interfaces/user.interface';
import {Router} from '@angular/router';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// Firestore
import { AngularFireAuth} from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
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
  private subscriptionToUser = new Subscription();
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
        // If login event detected, subscribe to Firebase (User document)
        if (!this.subscriptionToUser.closed) { this.subscriptionToUser.unsubscribe(); }
        this.subscriptionToUser = this.subscribeToUser(user.uid);
        // Wait until authstate has uid (indicating that it has subscribed to Firebase)
        this.authState$.pipe(filter(state => state.uid ? true : false), take(1)).subscribe(() =>
          // And then change state to logged in
          this.authState$.next({...this.authState$.value, loggedIn: true})
        );
      } else {
        // If subscribed to Firebase (User document), unsubscribe
        if (!this.subscriptionToUser.closed) {
          this.subscriptionToUser.unsubscribe();
        }
        // Clear user data from state
        this.authState$.next({uid: null, roles: [], loggedIn: false, user: null});
      }
    });
  }

  /**
   * Creates an observable for the auth state of the application.
   * @return Observable that immediately returns the current auth state of the
   *         application and listens for changes
   */
  observeAuthState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  /**
   * Gets the data of the user, either by fetching it from Firebase, or by
   * retrieving it from stored value (if available). If the user is not
   * authenticated, this function returns a promise that resolves to null.
   * @async
   * @return            Promise that resolves to a snapshot of the user data
   * @throws            If user is not authenticated, throws 'User is not authenticated'
   */
  /**
   * Creates an observable for the updates of User document in Firebase.
   * @return Observable that multicasts the current value of AdminsList in Firebase
   * @throws If user is not authenticated, throws 'User is not authenticated'
   */
  observeUser(): Observable<User> {
    // Validate that the user is authenticated
    if (!this.authState$.value.uid) { throw Error('User is not authenticated'); }

    // If subscribed to Firebase (User document)
    if (this.subscriptionToUser.closed) {
      this.subscriptionToUser = this.subscribeToUser(this.authState$.value.uid);
    }

    // Return observable of User document
    return this.authState$.pipe(map(s => s.user));
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

    if (data.uid)        { throw Error('Cannot change User.uid'); }
    if (data.roles)      { throw Error('Cannot change User.roles through AuthService, use UserService with superadmin priviledges'); }
    if (data.matricula)  { throw Error('Cannot change User.matricula through AuthService, use UserService with superadmin priviledges'); }
    if (data.roles)      { throw Error('Cannot change User.roles through AuthService, use UserService with superadmin priviledges'); }
    if (data.administra) { throw Error('Cannot change User.administra through AuthService, use UserService with superadmin priviledges'); }
    if (data.following)  { throw Error('Cannot change User.roles through AuthService, use EventService with user priviledges'); }

    await this.afs.doc<User>(`users/${this.authState$.value.uid}`).update(data);
    this.authState$.next({...this.authState$.value, user: {...this.authState$.value.user, ...data}});
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
    const provider = new firebase.auth.GoogleAuthProvider()
                                 .setCustomParameters({prompt: 'select_account'});

    const credential = await this.afAuth.signInWithPopup(provider);
    const authorization = credential.additionalUserInfo;

    // Wait until auth state is logged in
    const authState = await this.authState$.pipe(filter(state => state.loggedIn), take(1)).toPromise();
    await this.afs.doc('shared/counters').update({['week-hits']: firebase.firestore.FieldValue.increment(1)});

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
      administra: []
    };
    // Check if email is of a tec student (Axxxxxxx@itesm.mx o axxxxxxx@itesm.mx)
    if (/[aA]\d{8}@itesm.mx/.test(data.email)) {
      data.matricula = data.email.substr(0, 9).toUpperCase();
    }
    // Return promise with user data if success, else return null promise
    return userRef.set(data)
                  .then(() => data, () => null)
                  .then((val: User | null) => {
                    this.authState$.next({...this.authState$.value, uid: data.uid, roles: data.roles, user: data});
                    this.afs.doc('shared/counters').update({['registered-tec']: firebase.firestore.FieldValue.increment(1)});
                    return val;
                  });
  }

  private subscribeToUser(uid: string): Subscription {
    // Check if uid was provided
    if (!uid) { throw Error('uid not provided'); }

    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${uid}`);
    return userRef.valueChanges().subscribe(user => {
      if (user) {
        this.authState$.next({...this.authState$.value, uid: user.uid, roles: user.roles, user});
      } else {
        this.authState$.next({...this.authState$.value, uid, roles: [], user: null});
      }
    });
  }
}
