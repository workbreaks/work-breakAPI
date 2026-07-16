export interface CreateEventDto {
  summary: string;
  description?: string;
  location?: string;
  startTime: Date | string;
  endTime: Date | string;
  timeZone?: string;
  attendees?: string[];
  colorId?: string;
  extendedProperties?: any;
  conferenceData?: any;
}

export interface CreateGoogleTaskDto {
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp
  status?: string; // 'needsAction' or 'completed'
}
