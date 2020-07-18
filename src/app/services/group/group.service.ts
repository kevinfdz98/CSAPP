import { Injectable } from '@angular/core';
import { AuthService, AuthState } from '../auth/auth.service';
import { Group } from 'src/app/shared/interfaces/group.interface';
import { GroupSummary } from 'src/app/shared/interfaces/group-summary.interface';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { UserService } from '../user/user.service';
import { User } from 'src/app/shared/interfaces/user.interface';
import { UserSummary } from 'src/app/shared/interfaces/user-summary.interface';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private authState: AuthState;
  private groupsList: {[gid: string]: GroupSummary} = null;
  private groupDetails: {[gid: string]: Group} = {};

  constructor(
    private auth: AuthService,
    private users: UserService,
    private afs: AngularFirestore
  ) {
    // Subscribe to changes in auth state from AuthService
    this.auth.getAuthState().subscribe(state => this.authState = state);
  }

  /**
   * Gets the data of a group, either by fetching it from Firebase, or by
   * retrieving it from stored value (if available). The calling user must
   * be authenticated and have superadmin 'su' privileges.
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
   * Gets a list of GroupSummary objects for the group groups, either by fetching
   * it from Firebase, or by retrieving it from stored list (if available).
   * The calling user must be authenticated and have superadmin 'su' privileges.
   * @async
   * @param forceUpdate If true, forces the function to fetch a snapshot from
   *                    Firebase and updates stored value (defaults to false)
   * @return            Promise that resolves to a snapshot of the list
   */
  async getGroupList(forceUpdate = false): Promise<{[gid: string]: GroupSummary}> {
    // Validate group superadmin privileges
    if (!this.authState.roles.includes('sa')) {
      throw Error('Operation needs superadmin privileges');
    }

    return (!this.groupsList || forceUpdate) ?
      this.fetchGroupList() :
      this.groupsList;
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
        // Update admin list in UserService
        this.users.getAdminList(true);
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
    admins.list.ref = this.afs.doc<{[gid: string]: GroupSummary}>(`shared/groups`).ref;

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

      return group;
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

  /**
   * Fetches a list of GroupSummary objects for the group groups from Firebase.
   * The calling user must be authenticated and have superadmin 'su' privileges.
   * @async
   * @return            Promise that resolves to a snapshot of the list
   */
  private async fetchGroupList(): Promise<{[gid: string]: GroupSummary}> {
    // Validate superadmin privileges
    if (!this.authState.roles.includes('sa')) { throw Error('Operation needs superadmin privileges'); }

    const adminListRef = this.afs.doc<{[gid: string]: GroupSummary}>(`shared/groups`);
    return adminListRef.get().pipe(map(doc => {
        // If the document exists, return promise with group data
        if (doc.exists) {
          this.groupsList = doc.data() as {[gid: string]: GroupSummary};
          return {...this.groupsList};
        }
        // else, return null promise
        this.groupsList = {};
        return null;
      })
    ).toPromise();
  }

  private mapGroupToGroupSummary(g: Group): GroupSummary {
    return {
      gid: g.gid,
      name: g.name,
      majors: g.majors
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
