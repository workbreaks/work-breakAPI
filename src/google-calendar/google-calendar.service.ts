import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { CreateEventDto, CreateGoogleTaskDto } from './google-calendar.dto';
import { formatDescription, cleanDescription, getUtcStringForZone } from './google-calendar.utils';

const formatDateTime = (input: Date | string) => {
  if (typeof input === 'string') {
    // Pass floating ("...T12:43:00") and offset-bearing ("...T12:43:00+05:00") strings
    // as-is so Google Calendar receives the explicit local time + offset.
    // Only convert to UTC ISO if the string already ends with 'Z'.
    if (input.includes('T') && !input.endsWith('Z')) {
      return input;
    }
  }
  return new Date(input).toISOString();
};

@Injectable()
export class GoogleCalendarService {
  private readonly oauth2Client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );
  }

  private async getValidToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await this.oauth2Client.getAccessToken();
    if (!token) {
      throw new InternalServerErrorException('Auth failed');
    }
    return token;
  }

  /**
   * Updates the user's primary Google Calendar timezone to match their app timezone.
   * Call this when creating the first event so events always display at the correct
   * local time regardless of what the user's Google Calendar defaulted to.
   */
  async syncCalendarTimezone(refreshToken: string, timezone: string): Promise<void> {
    try {
      const accessToken = await this.getValidToken(refreshToken);
      if (!accessToken || !timezone) return;

      await axios.patch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        { timeZone: timezone },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(`Google Calendar timezone synced to: ${timezone}`);
    } catch (error: any) {
      // Non-blocking — don't fail the main operation if this fails
      console.warn('Could not sync Google Calendar timezone:', error?.message);
    }
  }

  async createCalendarEvent(refreshToken: string, eventData: CreateEventDto) {
    try { 
      const accessToken = await this.getValidToken(refreshToken);
      if (!accessToken) {
        throw new InternalServerErrorException('Failed to obtain access token');
      }  
      const defaultTimeZone = eventData.timeZone || 'UTC';
      // Sync the user's Google Calendar timezone so events always display correctly
      await this.syncCalendarTimezone(refreshToken, defaultTimeZone);
      const attendeesInfo = eventData.attendees
        ? eventData.attendees.map(email => ({ email }))
        : [];
      console.log("defaultTimeZone and attendeesInfo",defaultTimeZone, attendeesInfo);
      const eventBody = {
        summary: eventData.summary,
        description: formatDescription(eventData.description),
        location: eventData.location,
        colorId: eventData.colorId,
        extendedProperties: eventData.extendedProperties,
        conferenceData: eventData.conferenceData,
        start: {
          dateTime: formatDateTime(eventData.startTime),
          timeZone: defaultTimeZone,
        },
        end: {
          dateTime: formatDateTime(eventData.endTime),
          timeZone: defaultTimeZone,
        },
        attendees: attendeesInfo,
      };

      console.log("eventBody eventBody",eventBody);
      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        eventBody,
        {

          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            sendUpdates: attendeesInfo.length > 0 ? 'all' : 'none',
            conferenceDataVersion: eventData.conferenceData ? 1 : 0,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new InternalServerErrorException('Failed to create calendar event');
    }
  }


  async updateCalendarEvent(refreshToken: string, eventId: string, eventData: Partial<CreateEventDto>) {
    try {
      const accessToken = await this.getValidToken(refreshToken);
      if (!accessToken) {
        throw new InternalServerErrorException('Failed to obtain access token');
      }
      const defaultTimeZone = eventData.timeZone || 'UTC';

      const requestBody: any = {};

      if (eventData.summary) requestBody.summary = eventData.summary;
      if (eventData.description !== undefined) {
        requestBody.description = formatDescription(eventData.description);
      }
      if (eventData.location) requestBody.location = eventData.location;
      if (eventData.colorId) requestBody.colorId = eventData.colorId;
      if (eventData.extendedProperties) requestBody.extendedProperties = eventData.extendedProperties;

      if (eventData.startTime) {
        requestBody.start = {
          dateTime: formatDateTime(eventData.startTime),
          timeZone: defaultTimeZone,
        };
      }

      if (eventData.endTime) {
        requestBody.end = {
          dateTime: formatDateTime(eventData.endTime),
          timeZone: defaultTimeZone,
        };
      }

      const response = await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        requestBody,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new InternalServerErrorException('Failed to update calendar event');
    }
  }

  /**
   * Deletes a calendar event
   * @param refreshToken The user's Google refresh token
   * @param eventId The ID of the event to delete
   */
  async deleteCalendarEvent(refreshToken: string, eventId: string) {
    try {
      const accessToken = await this.getValidToken(refreshToken);
      if (!accessToken) {
        throw new InternalServerErrorException('Failed to obtain access token');
      }

      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new InternalServerErrorException('Failed to delete calendar event');
    }
  }

async getCalendarEvents(
  refreshToken: string,
  startDate: string,
  endDate: string,
  timeZone: string,
  maxResults: number = 100,
) {
  try {
    const accessToken = await this.getValidToken(refreshToken);

    if (!accessToken) {
      throw new InternalServerErrorException('Failed to obtain access token');
    }

    // Safely generate your ISO boundaries without any "Invalid Date" errors
    const timeMinIso = getUtcStringForZone(startDate, 0, 0, 0, 0, timeZone);
    const timeMaxIso = getUtcStringForZone(endDate || startDate, 23, 59, 59, 999, timeZone);

    const params = {
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      maxResults: Math.min(maxResults, 150),
      singleEvents: true,
      orderBy: "startTime",
    };
    
    console.log("Constructed Request Params:", params);

    const response = await axios.get(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      },
    );

    const events = response.data.items || [];

    return events.map(evt => ({
      ...evt,
      description: cleanDescription(evt.description),
    }));
  } catch (error: any) {
    // TEMPORARY: Log the absolute raw error so you can see if Google is rejecting anything else
    console.error(
      'CRITICAL: Raw Google Calendar API Error Details:',
      error?.response?.data || error.message || error
    );

    throw new InternalServerErrorException(
      'Failed to fetch calendar events',
    );
  }
}

  /**
   * Creates a Google Task
   * @param refreshToken The user's Google refresh token
   * @param taskData The details of the task
   */
  async createGoogleTask(refreshToken: string, taskData: CreateGoogleTaskDto) {
    try {
      const accessToken = await this.getValidToken(refreshToken);
      if (!accessToken) {
        throw new InternalServerErrorException('Failed to obtain access token');
      }

      const dueDate = taskData.due
        ? `${taskData.due}T00:00:00.000Z`
        : undefined;
      const response = await axios.post(
        'https://www.googleapis.com/tasks/v1/lists/@default/tasks',
        {
          title: taskData.title,
          notes: taskData.notes,
          due: dueDate,
          status: taskData.status || 'needsAction',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Google Task:');
      throw new InternalServerErrorException('Failed to create Google Task');
    }
  }

  /**
   * Updates an existing Google Task
   * @param refreshToken The user's Google refresh token
   * @param taskId The ID of the task to update
   * @param taskData Partial task data to update
   */
  async updateGoogleTask(refreshToken: string, taskId: string, taskData: Partial<CreateGoogleTaskDto>) {
    try {
      const accessToken = await this.getValidToken(refreshToken);
      if (!accessToken) {
        throw new InternalServerErrorException('Failed to obtain access token');
      }
      const dueDate = taskData.due
              ? `${taskData.due}T00:00:00.000Z`
              : undefined;
      const requestBody: any = {};
      if (taskData.title) requestBody.title = taskData.title;
      if (taskData.notes !== undefined) requestBody.notes = taskData.notes;
      requestBody.due = dueDate;
      if (taskData.status) requestBody.status = taskData.status;

      const response = await axios.patch(
        `https://www.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
        requestBody,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error updating Google Task:');
      throw new InternalServerErrorException('Failed to update Google Task');
    }
  }

  /**
   * Deletes a Google Task
   * @param refreshToken The user's Google refresh token
   * @param taskId The ID of the task to delete
   */
  async deleteGoogleTask(refreshToken: string, taskId: string) {
    try {
      const accessToken = await this.getValidToken(refreshToken);
      if (!accessToken) {
        throw new InternalServerErrorException('Failed to obtain access token');
      }

      await axios.delete(
        `https://www.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting Google Task:', error);
      throw new InternalServerErrorException('Failed to delete Google Task');
    }
  }
}
