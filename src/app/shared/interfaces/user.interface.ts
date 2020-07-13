export interface User {
  uid: string;
  fName: string;
  lName: string;
  email: string;
  roles: string[];
  major?: string;
  matricula?: string;
  semester?: number;
  administra?: string[];
  following: string[];
  isNewUser: boolean;
}
