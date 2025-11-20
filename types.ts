export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface FormattedLyricsResponse {
  original: string;
  formatted: string;
  timestamp: number;
}
