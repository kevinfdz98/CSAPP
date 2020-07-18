import { Injectable } from '@angular/core';
import { AuthService, AuthState } from '../auth/auth.service';
import { User } from 'src/app/shared/interfaces/user.interface';
import { UserSummary } from 'src/app/shared/interfaces/user-summary.interface';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authState: AuthState;
  private adminsList: {[uid: string]: UserSummary} = null;
  private userDetails: {[uid: string]: User} = {};

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore
  ) {
    // Subscribe to changes in auth state from AuthService
    this.auth.getAuthState().subscribe(state => this.authState = state);
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
   * Gets a list of UserSummary objects for the group admins, either by fetching
   * it from Firebase, or by retrieving it from stored list (if available).
   * The calling user must be authenticated and have superadmin 'sa' privileges.
   * @async
   * @param forceUpdate If true, forces the function to fetch a snapshot from
   *                    Firebase and updates stored value (defaults to false)
   * @return            Promise that resolves to a snapshot of the list
   */
  async getAdminList(forceUpdate = false): Promise<{[uid: string]: UserSummary}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    console.log(this.adminsList);

    return (!this.adminsList || forceUpdate) ?
      this.fetchAdminList() :
      this.adminsList;
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
        // If admin role changes, do update in adminList
        if (user.old.roles.includes('a') !== user.new.roles.includes('a')) {
          // If admin role is added, record in list; else, delete record from list
          if (user.new.roles.includes('a')) {
            this.adminsList[uid] = this.mapUserToUserSummary(user.new);
          } else {
            delete this.adminsList[uid];
          }
        }
        // In any case, update userDetails
        this.userDetails[uid] = {...user.new};
      }
    });
  }

  private updateRolesTransaction(uid: string, removeRoles: string[] = [], addRoles: string[] = []): Promise<{old: User, new: User}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const ref: {[key: string]: DocumentReference} = {};
    const user: {old: User, new: User} = {old: null, new: null};

    ref.user      = this.afs.doc<User>(`users/${uid}`).ref;
    ref.adminList = this.afs.doc<{[uid: string]: UserSummary}>(`shared/admins`).ref;

    return this.afs.firestore.runTransaction(async trans => {
        user.old = (await trans.get(ref.user)).data() as User;
        // First, remove specified roles
        user.new = {...user.old, roles: user.old.roles.filter(r => !removeRoles.includes(r))};
        // Then, include specified roles
        user.new.roles = [].concat(user.new.roles, addRoles.filter(r => !user.new.roles.includes(r)));

        // If admin role changes, do update in adminList
        if (user.old.roles.includes('a') !== user.new.roles.includes('a')) {

          // If admin role is added, record in list; else, delete record from list
          if (user.new.roles.includes('a')) {
            trans.update(ref.adminList, {[uid]: this.mapUserToUserSummary(user.new)});
          } else {
            trans.update(ref.adminList, {[uid]: firebase.firestore.FieldValue.delete()});
          }
        }
        // In any case, update roles in users collection
        trans.update(ref.user, {roles: user.new.roles});
        return user;
      }
    );
  }

  /**
   * Fetches the data of a user from Firebase and returns a promise with the data.
   * The calling user must be authenticated and have superadmin 'sa' privileges.
   * @async
   * @param  uid     Id of the user to fetch
   * @return         Promise that returns the user's data
   */
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
        return null;
      })
    ).toPromise();
  }

  /**
   * Fetches a list of UserSummary objects for the group admins from Firebase.
   * The calling user must be authenticated and have superadmin 'sa' privileges.
   * @async
   * @return            Promise that resolves to a snapshot of the list
   */
  private async fetchAdminList(): Promise<{[uid: string]: UserSummary}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const adminListRef = this.afs.doc<{[uid: string]: UserSummary}>(`shared/admins`);
    return adminListRef.get().pipe(map(doc => {
        // If the document exists, return promise with user data
        if (doc.exists) {
          this.adminsList = doc.data() as {[uid: string]: UserSummary};
          return {...this.adminsList};
        }
        // else, return null promise
        this.adminsList = {};
        return null;
      })
    ).toPromise();
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
