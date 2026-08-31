// RBPH template infrastructure. Theme developers should not modify this file.

export enum RbtSyncMessageType {
  Unknown = -1,
  SystemStatusUpdated = 1,
  GameNewAnnouncement = 101,
  GameReleaseUpdated = 102,
  GameFrontendUpdated = 103,
  TeamInfoUpdated = 201,
  TeamDisbanded = 202,
  TeamSelfKicked = 203,
  TeamSelfPromoted = 204,
  PuzzleSubmitted = 301,
  PuzzleHintUnlocked = 302,
  PuzzleBackendEvent = 303,
  TicketUpdated = 401,
  NotificationUpdated = 402,
}

export const RBT_SYNC_MESSAGE_TYPES = Object.freeze([
  RbtSyncMessageType.Unknown,
  RbtSyncMessageType.SystemStatusUpdated,
  RbtSyncMessageType.GameNewAnnouncement,
  RbtSyncMessageType.GameReleaseUpdated,
  RbtSyncMessageType.GameFrontendUpdated,
  RbtSyncMessageType.TeamInfoUpdated,
  RbtSyncMessageType.TeamDisbanded,
  RbtSyncMessageType.TeamSelfKicked,
  RbtSyncMessageType.TeamSelfPromoted,
  RbtSyncMessageType.PuzzleSubmitted,
  RbtSyncMessageType.PuzzleHintUnlocked,
  RbtSyncMessageType.PuzzleBackendEvent,
  RbtSyncMessageType.TicketUpdated,
  RbtSyncMessageType.NotificationUpdated,
] as const);
