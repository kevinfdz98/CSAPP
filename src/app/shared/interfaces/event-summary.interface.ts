import { EventTypes } from '../enums/event-types.enum';

export interface EventSummary {
  eid: string;
  title: string;
  type: EventTypes;
  areaT21: string; // Tec21 compatible
  organizingGroups: string[];
  timestamp: {start: Date, end: Date};
}
