// Shared domain interfaces for FocusTrack

export interface User {
  userID: string | number;
  userName: string;
  userEmail: string;
  userStatus: string;
}

export interface UserFormData {
  userId?: string | number;
  userName: string;
  userEmail: string;
}

export interface Announcement {
  announcementID: string | number;
  announcementTitle: string;
  announcementDescription: string;
  announcementStatus: number;
}

export interface AnnouncementFormData {
  announcementId?: string | number;
  announcementTitle: string;
  announcementDesc: string;
}
