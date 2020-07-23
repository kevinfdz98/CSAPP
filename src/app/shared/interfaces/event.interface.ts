import { EventTypes } from '../enums/event-types.enum';

export interface Event {
  eid: string;
  title: string;
  type: EventTypes;
  area: {Tec20: string, Tec21: string};
  organizingGroups: string[];
  timestamp: {start: Date, end: Date};
  place: string;
  description: string;
  linkRegister: string;
  linkEvent: string;
  imgUrl: string;
  followersCount: string;
}
