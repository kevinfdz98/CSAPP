import { EventTypes } from '../enums/event-types.enum';

export interface EventSummary {
  eid: string;
  title: string;
  type: EventTypes;
  area: {Tec20: string, Tec21: string};
  timestamp: {start: Date, end: Date};
}
