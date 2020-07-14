export interface User {
  uid: string;
  fName: string;
  lName: string;
  email: string;
  roles: string[];
  following: string[];
  isNewUser: boolean;
  // Atributos para alumnos Tec
  model?: string;
  major?: string;
  matricula?: string;
  semester?: number;
  // Atributos para administradores de grupos
  administra?: string[];
}
