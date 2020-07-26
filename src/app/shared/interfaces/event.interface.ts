import { EventTypes } from '../enums/event-types.enum';

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
  followers: string[];
}
