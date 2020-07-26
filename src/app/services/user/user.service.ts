import { Injectable } from '@angular/core';
import { AuthService, AuthState } from '../auth/auth.service';
import { User } from 'src/app/shared/interfaces/user.interface';
import { UserSummary } from 'src/app/shared/interfaces/user-summary.interface';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { BehaviorSubject, Subscription, Observable } from 'rxjs';
import { Group } from 'src/app/shared/interfaces/group.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private subscriptionToAdminsList = new Subscription();
  private authState: AuthState;
  private adminsList$ = new BehaviorSubject<{[uid: string]: UserSummary}>({});
  private userDetails: {[uid: string]: User} = {};

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore
  ) {
    // Initialize subscriptionToAdminsList as a closed subscription
    this.subscriptionToAdminsList.closed = true;

    // Subscribe to changes in auth state from AuthService
    this.auth.observeAuthState().subscribe(state => {
      // If subscribed to Firebase (adminsList)
      if (!this.subscriptionToAdminsList.closed) {
        // If user logs out or their 'sa' role is removed
        if (!state.loggedIn || (state.roles && !state.roles.includes('sa'))) {
          // Unsubscribe from Firebase (adminsList)
          this.subscriptionToAdminsList.unsubscribe();
          this.adminsList$.next({});
        }
      }
      // Update local copy of AuthState
      this.authState = state;
    });
  }

  /**
   * Gets the data of a user, either by fetching it from Firebase, or by
   * retrieving it from stored value (if available). The calling user must
   * be authenticated and have superadmin 'sa' privileges.
   * @async
   * @param forceUpdate If true, forces the function to fetch a snapshot from
   *                    Firebase and updates stored value (defaults to false)
   * @return            Promise that resolves to a snapshot of the user data
   */
  async getUser(uid: string, forceUpdate = false): Promise<User> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('User needs superadmin privileges'); }

    return (!this.userDetails[uid] || forceUpdate) ?
      this.fetchUser(uid) :
      this.userDetails[uid];
  }

  /**
   * Gets the data of a user using their email as a lookup key. Either it is fetched
   * from firebase or it is retrieved from stored value (if available). The calling user must
   * be authenticated and have superadmin 'sa' privileges.
   * @async
   * @param forceUpdate If true, forces the function to fetch a snapshot from
   *                    Firebase and updates stored value (defaults to false)
   * @return            Promise that resolves to a snapshot of the user data
   */
  async getUserByEmail(email: string, forceUpdate = false): Promise<User> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('User needs superadmin privileges'); }

    const localResults = Object.values(this.userDetails).filter(user => user.email === email);
    return (localResults.length === 0 || forceUpdate) ?
      this.fetchUserByEmail(email) :
      localResults[0];
  }

  /**
   * Creates an observable for the updates of AdminsList in Firebase. Internally
   * uses a BehaviorSubject to multicast these the values to all created observables.
   * Note that these operation requires superadmin ('sa') priviledges and will fail
   * otherwise.
   * @return Observable that multicasts the current value of AdminsList in Firebase
   * @throws Throws 'Operation needs superadmin privileges if calling user is not
   *         authenticated as a superadmin
   */
  observeAdminsList(): Observable<{[uid: string]: UserSummary}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    // If subscribed to Firebase (adminsList)
    if (this.subscriptionToAdminsList.closed) {
      this.subscriptionToAdminsList = this.subscribeToAdminsList();
    }

    // Return observable of adminsList
    return this.adminsList$.asObservable();
  }

  /**
   * Updates the roles of a user given its uid and two optional arrays
   * The calling user must be authenticated and have superadmin 'sa' privileges.
   * @async
   * @param  removeRoles Array of roles to be removed before adding new roles
   * @param  addRoles    Aray of roles to be added after removing specified roles
   * @return             Promise that resolves to a snapshot of the list
   */
  async updateRoles(uid: string, removeRoles: string[] = [], addRoles: string[] = []): Promise<void> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    return this.updateRolesTransaction(uid, removeRoles, addRoles).then(user => {
      if (user) {
        // Update local copy of userDetails
        this.userDetails[uid] = {...user.new};
      }
    });
  }

  /**
   * Updates the groups of a user given its uid and two optional arrays
   * The calling user must be authenticated and have superadmin 'sa' privileges.
   * @async
   * @param  removeGroups Array of groups to be removed before adding new groups
   * @param  addGroups    Aray of groups to be added after removing specified groups
   * @return              Promise that resolves to a snapshot of the list
   */
  async updateGroups(uid: string, removeGroups: string[] = [], addGroups: string[] = []): Promise<void> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    return this.updateGroupsTransaction(uid, removeGroups, addGroups).then(user => {
      if (user) {
        // Update local copy of userDetails
        this.userDetails[uid] = {...user.new};
      }
    });
  }

  private updateRolesTransaction(uid: string, removeRoles: string[] = [], addRoles: string[] = []): Promise<{old: User, new: User}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const user: {
      ref: DocumentReference, old: User, new: User
    } = {ref: null, old: null, new: null};
    const list: {
      ref: DocumentReference, old: User, new: User
    } = {ref: null, old: null, new: null};

    user.ref = this.afs.doc<User>(`users/${uid}`).ref;
    list.ref = this.afs.doc<{[uid: string]: UserSummary}>(`shared/admins`).ref;

    return this.afs.firestore.runTransaction(async trans => {
        // Get current state of User document
        user.old = (await trans.get(user.ref)).data() as User;
        // Get minimum removals
        removeRoles = removeRoles.filter(role => user.old.roles.includes(role) && !addRoles.includes(role));
        // Get minimum additions
        addRoles = addRoles.filter(role => !user.old.roles.includes(role));
        // Build new User document with minimum removals and additions
        user.new = {...user.old, roles: user.old.roles.filter(role => !removeRoles.includes(role)).concat(addRoles)};
        // If new user is admin, update adminList
        trans.update(list.ref, user.new.roles.includes('a') ?
          {[uid]: this.mapUserToUserSummary(user.new)} :
          {[uid]: firebase.firestore.FieldValue.delete()}
        );
        // In any case, update roles in users collection
        trans.update(user.ref, {roles: user.new.roles});
        return {old: user.old, new: user.new};
      }
    );
  }

  private updateGroupsTransaction(uid: string, removeGroups: string[] = [], addGroups: string[] = []): Promise<{old: User, new: User}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const user: {
      ref: DocumentReference, old: User, new: User
    } = {ref: null, old: null, new: null};
    const admins: {
      list: {ref: DocumentReference}
    } = {list: {ref: null}};
    const groups: {
      toAdd: {ref: DocumentReference, data: Group}[],
      toRemove: {ref: DocumentReference, data: Group}[]
    } = {toAdd: [], toRemove: []};

    user.ref = this.afs.doc<User>(`users/${uid}`).ref;
    admins.list.ref = this.afs.doc<{[uid: string]: UserSummary}>(`shared/admins`).ref;

    return this.afs.firestore.runTransaction(async trans => {
      // Get current state of User document
      user.old = (await trans.get(user.ref)).data() as User;
      // Get minimum removals
      removeGroups = removeGroups.filter(group => user.old.administra.includes(group) && !addGroups.includes(group));
      // Get minimum additions
      addGroups = addGroups.filter(group => !user.old.administra.includes(group));
      // Build new User document with minimum removals and additions
      user.new = {...user.old, administra: user.old.administra.filter(group => !removeGroups.includes(group)).concat(addGroups)};

      // Get info of groups to remove
      await removeGroups.reduce(async (promise, gid, i) => {
        await promise;
        groups.toRemove[i] = {ref: null, data: null};
        groups.toRemove[i].ref = this.afs.doc<Group>(`groups/${gid}`).ref;
        groups.toRemove[i].data = (await trans.get(groups.toRemove[i].ref)).data() as Group;
      }, Promise.resolve());

      // Get info of groups to add
      await addGroups.reduce(async (promise, gid, i) => {
        await promise;
        groups.toAdd[i] = {ref: null, data: null};
        groups.toAdd[i].ref = this.afs.doc<Group>(`groups/${gid}`).ref;
        groups.toAdd[i].data = (await trans.get(groups.toAdd[i].ref)).data() as Group;
      }, Promise.resolve());

      // Process group removals
      await groups.toRemove.reduce(async (promise, group) => {
        await promise;
        // Remove user from admins list of this group
        trans.update(group.ref, {admins: firebase.firestore.FieldValue.arrayRemove(uid)});
      }, Promise.resolve());

      // Process group additions
      await groups.toAdd.reduce(async (promise, group) => {
        await promise;
        // Add user from admins list of this group
        trans.update(group.ref, {admins: firebase.firestore.FieldValue.arrayUnion(uid)});
      }, Promise.resolve());

      // If user is a new admin, add role
      if (user.old.administra.length === 0 && user.new.administra.length > 0) {
        user.new.roles = ['a'].concat(user.old.roles.filter(r => r !== 'a'));
      }
      // If user is no more an admin, remove role
      else if (user.old.administra.length > 0 && user.new.administra.length === 0) {
        user.new.roles = user.old.roles.filter(r => r !== 'a');
      }
      // If new user is admin, update adminList
      trans.update(admins.list.ref, user.new.roles.includes('a') ?
        {[uid]: this.mapUserToUserSummary(user.new)} :
        {[uid]: firebase.firestore.FieldValue.delete()}
      );
      // In any case, update groups in in User document
      trans.update(user.ref, {administra: user.new.administra, roles: user.new.roles});
      return {old: user.old, new: user.new};
    });
  }

  private async fetchUser(uid: string): Promise<User> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const userRef = this.afs.doc<User>(`users/${uid}`);
    return userRef.get().pipe(map(doc => {
        // If the document exists, return promise with user data
        if (doc.exists) {
          this.userDetails[uid] = doc.data() as User;
          return {...this.userDetails[uid]};
        }
        // else, return null promise
        delete this.userDetails[uid];
        return null;
      })
    ).toPromise();
  }

  private async fetchUserByEmail(email: string): Promise<User> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const UserCollectRef = this.afs.collection(`users`).ref;
    return UserCollectRef.where('email', '==', email).get().then(snap => {
      if (snap.empty) {
        return null; // If user not found, return null
      } else {
        const uid = snap.docs[0].id;
        this.userDetails[uid] = snap.docs[0].data() as User;
        return {...this.userDetails[uid]}; // If found, return document data
      }
    });
  }

  private subscribeToAdminsList(): Subscription {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const adminsListRef = this.afs.doc<{[uid: string]: UserSummary}>(`shared/admins`);
    return adminsListRef.valueChanges().subscribe(list => this.adminsList$.next(list));
  }

  private mapUserToUserSummary(u: User): UserSummary {
    return {
      uid: u.uid,
      email: u.email,
      fName: u.fName,
      lName: u.lName,
      roles: u.roles,
      administra: u.administra,
    };
  }
}
