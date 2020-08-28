import { EventTypes } from '../enums/event-types.enum';
import { Models } from '../enums/major-models.enum';

export interface Event {
  eid: string;
  title: string;
  type: EventTypes;
  areaT21: string; // Tec21 compatible
  organizingGroups: string[];
  timestamp: {start: Date, end: Date};
  place: string;
  description: string;
  linkRegister: string;
  linkEvent: string;
  imgUrl: string;
  favoriteof: string[];
  registered: {
    [uid: string]: {
      uid: string;
      fName: string;
      lName: string;
      email: string;
      // Atributos para alumnos Tec
      model?: Models;
      major?: string;
      matricula?: string;
      semester?: number;
    }
  };
}
