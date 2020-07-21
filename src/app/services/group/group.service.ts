import { Injectable } from '@angular/core';
import { AuthService, AuthState } from '../auth/auth.service';
import { Group } from 'src/app/shared/interfaces/group.interface';
import { GroupSummary } from 'src/app/shared/interfaces/group-summary.interface';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { User } from 'src/app/shared/interfaces/user.interface';
import { UserSummary } from 'src/app/shared/interfaces/user-summary.interface';
import { BehaviorSubject, Subscription, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private subscriptionToGroupsList = new Subscription();
  private authState: AuthState;
  private groupsList$ = new BehaviorSubject<{[gid: string]: GroupSummary}>({});
  private groupDetails: {[gid: string]: Group} = {};

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore
  ) {
    // Initialize subscriptionToGroupsList as a closed subscription
    this.subscriptionToGroupsList.closed = true;

    // Subscribe to changes in auth state from AuthService
    this.auth.getAuthState().subscribe(state => {
      // If subscribed to Firebase (groupsList)
      if (!this.subscriptionToGroupsList.closed) {
        // If user logs out or their 'sa' role is removed
        if (!state.loggedIn || (state.roles && !state.roles.includes('sa'))) {
          // Unsubscribe from Firebase (groupsList)
          this.subscriptionToGroupsList.unsubscribe();
          this.groupsList$.next({});
        }
      }
      // Update local copy of AuthState
      this.authState = state;
    });
  }

  /**
   * Creates a group in the Firebase database. The method validates prior to
   * creation that the group id is not already taken and returns a Promise
   * with a boolean value indicating whether the creation was successful.
   * @async
   * @return Promise with a boolean determining the result of the creation
   */
  async createGroup(data: Group): Promise<boolean> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }
    // Normalize and convert to uppercase the group id
    data.gid = data.gid.toUpperCase().normalize();

    const groupRef = this.afs.doc<Group>(`groups/${data.gid}`).ref;
    const groupsListRef = this.afs.doc<Group>(`shared/groups`).ref;

    // Try to create group in a Firebase transaction
    return this.afs.firestore.runTransaction(async trans => {
      // If group already exists, return false
      if ((await trans.get(groupRef)).exists) { return false; }
      // Else, create group and return true
      trans.set(groupRef, data);
      trans.set(groupsListRef, {[data.gid]: this.mapGroupToGroupSummary(data)});
      return true;
    }).then(created => {
      // If successfuly created, update local copy of group details
      if (created) { this.groupDetails[data.gid] = data; }
      return created;
    });
  }

  /**
   * Deletes a group in the Firebase database.
   * @async
   * @return Promise with a boolean determining the result of the creation
   */
  async deleteGroup(gid: string): Promise<boolean> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const groupRef = this.afs.doc<Group>(`groups/${gid}`).ref;
    const groupsListRef = this.afs.doc<Group>(`shared/groups`).ref;

    // Try to create group in a Firebase transaction
    return this.afs.firestore.runTransaction(async trans => {
      trans.delete(groupsListRef);
      trans.update(groupRef, {[gid]: firebase.firestore.FieldValue.delete()});
      return true;
    }).then(deleted => {
      // If successfuly deleted, update local copy of group details
      if (deleted && this.groupDetails[gid]) { delete this.groupDetails[gid]; }
      return deleted;
    });
  }

  /**
   * Updates a group in the Firebase database.
   * @async
   * @return Promise with the resulting group information
   */
  async updateGroup(gid: string, data: Partial<Group>): Promise<Group> {
    // Validate group admin or superadmin privileges
    if (!(this.authState.user.administra.includes(gid) || this.authState.roles.includes('sa'))) {
      throw Error('Operation needs admin or superadmin privileges');
    }
    // Validate that this function is not being used to update admins
    if (data.admins) { throw Error('To update admins of a group, use the updateAdmins() function'); }

    const group: {
      ref: DocumentReference, old: Group, new: Group, listRef: DocumentReference
    } = {ref: null, old: null, new: null, listRef: null};

    group.ref = this.afs.doc<Group>(`groups/${gid}`).ref;
    group.listRef = this.afs.doc<Group>(`shared/groups`).ref;

    // Try to update group in a Firebase transaction
    return this.afs.firestore.runTransaction(async trans => {
      group.old = (await trans.get(group.ref)).data() as Group;
      group.new = {...group.old, ...data};

      // Else, update group and return true
      trans.update(group.ref, data);
      trans.update(group.listRef, {[gid]: this.mapGroupToGroupSummary(group.new)});
      return group.new;
    }).then(newGroup => {
      // If successfuly updated, update local copy of group details
      if (newGroup) { this.groupDetails[newGroup.gid] = newGroup; }
      return newGroup;
    });
  }

  /**
   * Gets the data of a group, either by fetching it from Firebase, or by
   * retrieving it from stored value (if available). The calling user must
   * be authenticated and have admin 'a' privileges over the group or
   * global superadmin 'su' privileges.
   * @async
   * @param forceUpdate If true, forces the function to fetch a snapshot from
   *                    Firebase and updates stored value (defaults to false)
   * @return            Promise that resolves to a snapshot of the group data
   */
  async getGroup(gid: string, forceUpdate = false): Promise<Group> {
    // Validate group admin or superadmin privileges
    if (!(this.authState.user.administra.includes(gid) || this.authState.roles.includes('sa'))) {
      throw Error('Operation needs admin or superadmin privileges');
    }

    return (!this.groupDetails[gid] || forceUpdate) ?
      this.fetchGroup(gid) :
      this.groupDetails[gid];
  }

  /**
   * Creates an observable for the updates of GroupsList in Firebase. Internally
   * uses a BehaviorSubject to multicast these the values to all created observables.
   * Note that these operation requires superadmin ('sa') priviledges and will fail
   * otherwise.
   * @return Observable that multicasts the current value of GroupsList in Firebase
   * @throws Throws 'Operation needs superadmin privileges if calling user is not
   *         authenticated as a superadmin
   */
  observeGroupsList(): Observable<{[uid: string]: GroupSummary}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    // If subscribed to Firebase (adminsList)
    if (this.subscriptionToGroupsList.closed) {
      this.subscriptionToGroupsList = this.subscribeToGroupsList();
    }

    // Return observable of adminsList
    return this.groupsList$.asObservable();
  }

  /**
   * Updates the admins of a group given its gid and two optional arrays
   * The calling user must be authenticated and have superadmin 'su' privileges.
   * @async
   * @param  removeAdmins Array of admins to be removed before adding new admins
   * @param  addAdmins    Array of admins to be added after removing specified admins
   * @return              Promise that resolves to a snapshot of the list
   */
  async updateAdmins(gid: string, removeAdmins: string[] = [], addAdmins: string[] = []): Promise<void> {
    // Validate group admin or superadmin privileges
    if (!(this.authState.user.administra.includes(gid) || this.authState.roles.includes('sa'))) {
      throw Error('Operation needs admin or superadmin privileges');
    }

    return this.updateAdminsTransaction(gid, removeAdmins, addAdmins).then(group => {
      if (group) {
        // Update groupDetails in GroupService
        this.groupDetails[gid] = {...group.new};
      }
    });
  }

  private updateAdminsTransaction(gid: string, removeAdmins: string[] = [], addAdmins: string[] = []): Promise<{old: Group, new: Group}> {
    // Validate group admin or superadmin privileges
    if (!(this.authState.user.administra.includes(gid) || this.authState.roles.includes('sa'))) {
      throw Error('Operation needs admin or superadmin privileges');
    }

    const group: {
      ref: DocumentReference, old: Group, new: Group
    } = {ref: null, old: null, new: null};
    const admins: {
      list: {ref: DocumentReference}
      toAdd: {ref: DocumentReference, data: User}[],
      toRemove: {ref: DocumentReference, data: User}[]
    } = {list: {ref: null}, toAdd: [], toRemove: []};

    group.ref       = this.afs.doc<Group>(`groups/${gid}`).ref;
    admins.list.ref = this.afs.doc<{[uid: string]: UserSummary}>(`shared/admins`).ref;

    return this.afs.firestore.runTransaction(async trans => {
      // Get current state of Group document
      group.old = (await trans.get(group.ref)).data() as Group;
      // Get minimum removals
      removeAdmins = removeAdmins.filter(admin => group.old.admins.includes(admin) && !addAdmins.includes(admin));
      // Get minimum additions
      addAdmins = addAdmins.filter(admin => !group.old.admins.includes(admin));
      // Build new Group document with minimum removals and additions
      group.new = {...group.old, admins: group.old.admins.filter(admin => !removeAdmins.includes(admin)).concat(addAdmins)};

      // Get info of admins to remove
      await removeAdmins.reduce(async (promise, uid, i) => {
        await promise;
        admins.toRemove[i] = {ref: null, data: null};
        admins.toRemove[i].ref = this.afs.doc<User>(`users/${uid}`).ref;
        admins.toRemove[i].data = (await trans.get(admins.toRemove[i].ref)).data() as User;
      }, Promise.resolve());

        // Get info of admins to add
      await addAdmins.reduce(async (promise, uid, i) => {
        await promise;
        admins.toAdd[i] = {ref: null, data: null};
        admins.toAdd[i].ref = this.afs.doc<User>(`users/${uid}`).ref;
        admins.toAdd[i].data = (await trans.get(admins.toAdd[i].ref)).data() as User;
      }, Promise.resolve());

      // Process admin removals
      await admins.toRemove.reduce(async (promise, admin) => {
        await promise;
        // Determine if user should have admin role removed (this is the last group it admins)
        const removeRoleToo = admin.data.administra.filter(val => val !== gid).length === 0;
        trans.update(admin.ref, removeRoleToo ?
          {roles: firebase.firestore.FieldValue.arrayRemove('a'),
            administra: firebase.firestore.FieldValue.arrayRemove(gid)} :
          {administra: firebase.firestore.FieldValue.arrayRemove(gid)}
        );
        trans.update(admins.list.ref, removeRoleToo ?
          {[admin.data.uid]: firebase.firestore.FieldValue.delete()} :
          {[`${admin.data.uid}.administra`]: firebase.firestore.FieldValue.arrayRemove(gid)}
        );
      }, Promise.resolve());

      // Process admin additions
      await admins.toAdd.reduce(async (promise, admin) => {
        await promise;
        // Determine if user should have admin role added (this is the first group it admins)
        const addRoleToo = admin.data.administra.length === 0;
        trans.update(admin.ref, addRoleToo ?
          {roles: firebase.firestore.FieldValue.arrayUnion('a'),
            administra: firebase.firestore.FieldValue.arrayUnion(gid)} :
          {administra: firebase.firestore.FieldValue.arrayUnion(gid)}
        );
        trans.update(admins.list.ref, addRoleToo ?
          {[admin.data.uid]: {...this.mapUserToUserSummary(admin.data), roles: [...admin.data.roles, 'a'], administra: [gid]}} :
          {[`${admin.data.uid}.administra`]: firebase.firestore.FieldValue.arrayUnion(gid)}
        );
      }, Promise.resolve());

      // Update group info
      trans.update(group.ref, group.new);

      return {old: group.old, new: group.new};
    });
  }

  /**
   * Fetches the data of a group from Firebase and returns a promise with the data.
   * The calling user must be authenticated and have superadmin 'su' privileges.
   * @async
   * @param  gid     Id of the group to fetch
   * @return         Promise that returns the group's data
   */
  private async fetchGroup(gid: string): Promise<Group> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const groupRef = this.afs.doc<Group>(`groups/${gid}`);
    return groupRef.get().pipe(map(doc => {
        // If the document exists, return promise with group data
        if (doc.exists) {
          this.groupDetails[gid] = doc.data() as Group;
          return {...this.groupDetails[gid]};
        }
        // else, return null promise
        return null;
      })
    ).toPromise();
  }

  private subscribeToGroupsList(): Subscription {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const groupsListRef = this.afs.doc<{[gid: string]: GroupSummary}>(`shared/groups`);
    return groupsListRef.valueChanges().subscribe(list => this.groupsList$.next(list));
  }

  private mapGroupToGroupSummary(g: Group): GroupSummary {
    return {
      gid: g.gid,
      name: g.name,
      majorsTec21: g.majorsTec21,
      majorsTec20: g.majorsTec20
    };
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
