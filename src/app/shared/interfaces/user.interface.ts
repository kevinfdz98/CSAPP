export interface User {
  uid: string;
  fName: string;
  lName: string;
  email: string;
  roles: string[];
  major: string;
  administra?: string;
  following: string[];
}
