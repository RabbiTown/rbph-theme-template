// RBPH template infrastructure. Theme developers should not modify this file.

import type { App, Ref } from 'vue';
import type { RbtSyncMessageType } from './sync';
export { RbtSyncMessageType } from './sync';

export const RBT_CONTEXT_KEY = 'rbph-theme-context';

export enum RbtTeamPuzzleState {
  Locked = -1,
  Unlocked = 0,
  Solved = 1,
}

export type PuzzleRef = { id: number; slug?: string | null; title?: string };
export type RoundPuzzleState = PuzzleRef & { title: string; state: RbtTeamPuzzleState; answer?: string };
export type PuzzleTeamState = { state: RbtTeamPuzzleState; max_submit?: number | null; submit_count: number; cooldown_till?: string; answers?: string[] };
export type PuzzleSubmitRequirement = { type: 'currency_minimum'; currency_id: number; currency_name: string; currency_prec: number; minimum: number };
export type PuzzleAnnouncement = {
  id: number;
  title: string;
  content: string;
  content_type: number;
  game_id?: number | null;
  is_pinned: boolean;
  puzzles: { id: number; slug?: string | null; title: string; round_id: number; round_slug?: string | null; is_round_puzzle: boolean }[];
  utime_at: string;
};
export type RoundPageState = {
  data: { id: number; slug?: string | null; title: string; cover?: string; game_id: number; puzzle?: number; contents: unknown[] };
  state: { puzzles: RoundPuzzleState[]; puzzle?: PuzzleTeamState };
};
export type PuzzlePageState = {
  data: { id: number; slug?: string | null; title: string; game_id: number; round: PuzzleRef; contents: unknown[]; submission_enabled: boolean; submit_requirements: PuzzleSubmitRequirement[]; announcements: PuzzleAnnouncement[] };
  state: PuzzleTeamState;
};
export enum RbtJudgeAction {
  Error = -2,
  Pending = -1,
  Fail = 0,
  Correct = 1,
  Milestone = 2,
  StartGame = 3,
  EasterEgg = 4,
  FinishGame = 5,
}
export type JudgeResponse = {
  result: { action: RbtJudgeAction; result?: string; answer?: string };
  solved?: boolean;
  unlocks?: SyncPuzzleRef[];
  cooldown_till?: string;
  state?: PuzzleTeamState;
  currency?: SyncTeamCurrency[];
  currency_penalty?: SyncCurrencyPenalty[];
  content_changed?: boolean;
};
export type RbtJudgeActionConst = Readonly<{
  name: string;
  icon: string;
  color: 'error' | 'warning' | 'success' | 'primary' | 'secondary' | 'info' | 'neutral' | undefined;
  desc: string;
}>;
export type SubmitFeedback = 'host-toast' | 'none';
export type RbtContentType = 'markdown' | 'html' | 'unsafe-markdown';
export type RbtContentBlock = {
  id: number;
  sort?: number;
  contentType: RbtContentType;
  revision: string;
  content?: string;
  contentUrl?: string | null;
};
export type RbtCurrency = { id: number; slug?: string; name: string; amount: number; precision: number; growth?: number; icon?: string };
export type RbtSubmission = { userName?: string; answer: string; normalizedAnswer: string; action: RbtJudgeAction; message?: string; createdAt: string };
export type RbtSubmissionPage = { data: RbtSubmission[]; total: number };
export type SyncPuzzleRef = { id: number; slug?: string | null; title: string; round_id: number; round_slug?: string | null };
export type SyncTeamCurrency = {
  id: number;
  slug: string;
  name: string;
  growth: number;
  init_amount: number;
  prec: number;
  amount: number;
  current_amount?: number;
  max_amount: number;
  hidden?: boolean;
  utime_at: string;
};
export type SyncCurrencyPenalty = { currency_id: number; name: string; prec: number; amount: number };
export interface RbtSyncMessageMap {
  [RbtSyncMessageType.Unknown]: unknown;
  [RbtSyncMessageType.SystemStatusUpdated]: null;
  [RbtSyncMessageType.GameNewAnnouncement]: { game_id: number | null };
  [RbtSyncMessageType.GameReleaseUpdated]: { game_id: number; cursor: number; force: boolean };
  [RbtSyncMessageType.GameFrontendUpdated]: { game_id: number; revision: number };
  [RbtSyncMessageType.TeamInfoUpdated]: null;
  [RbtSyncMessageType.TeamDisbanded]: null;
  [RbtSyncMessageType.TeamSelfKicked]: null;
  [RbtSyncMessageType.TeamSelfPromoted]: null;
  [RbtSyncMessageType.PuzzleSubmitted]: {
    sid?: string;
    user: { id: number; name: string };
    puzzle: { id: number; title: string };
    answer: string;
    action: RbtJudgeAction;
    cooldown_till?: string;
    solved?: boolean;
    unlocks?: SyncPuzzleRef[];
    state?: PuzzleTeamState;
    currency?: SyncTeamCurrency[];
    currency_penalty?: SyncCurrencyPenalty[];
    content_changed?: boolean;
  };
  [RbtSyncMessageType.PuzzleHintUnlocked]: {
    sid?: string;
    user: { id: number; name: string };
    puzzle: { id: number; title: string };
    hint: { id: number; title: string; cost_id?: number | null; cost_amount: number };
  };
  [RbtSyncMessageType.PuzzleBackendEvent]: {
    puzzle_id: number;
    event: string;
    payload: unknown;
    actor: { id: number; nickname: string };
    source: { type: 'api' | 'judge' | 'hint_purchase'; function: string };
  };
  [RbtSyncMessageType.TicketUpdated]: {
    event: 'created' | 'message' | 'closed' | 'assigned' | 'unassigned';
    ticket_id: number;
    message_id?: number | null;
    actor_id: number;
    team_id: number;
    puzzle_id?: number | null;
    game_id: number;
  };
  [RbtSyncMessageType.NotificationUpdated]: {
    event: 'created' | 'read' | 'read_all';
    notification_id?: number | null;
    team_id: number;
    game_id: number;
  };
}
export type RbtSyncMessage<T extends RbtSyncMessageType> = Readonly<{ type: T; data: RbtSyncMessageMap[T] }>;
export interface RbtThemeI18n {
  readonly locale: Readonly<Ref<string>>;
  readonly availableLocales: Readonly<Ref<readonly string[]>>;
  t(key: string, values?: Record<string, unknown> | unknown[], plural?: number): string;
  te(key: string, locale?: string): boolean;
  n(value: number, options?: Intl.NumberFormatOptions): string;
  d(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string;
}

export interface RbtSyncTime {
  readonly currentTime: Readonly<Ref<number>>;
  calcCurrentTime(): number;
}

export interface RbtThemeUtils {
  formatDate(date?: Date | string | number | null): string;
  formatTime(milliseconds: number): string;
  intPrecString(number: number, precision: number, keepPlus?: boolean, pad?: string): string;
  formatCurrencyPenaltySuffix(penalty?: SyncCurrencyPenalty[]): string;
}

export type RbtApiHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RbtApiQueryValue = string | number | boolean | null | undefined | readonly (string | number | boolean | null | undefined)[];
export interface RbtApiRequestOptions<TBody = unknown> extends Omit<RequestInit, 'body' | 'method'> {
  path: string;
  method?: RbtApiHttpMethod;
  body?: TBody;
  query?: URLSearchParams | Record<string, RbtApiQueryValue>;
  errorHints?: Record<number, string>;
  timeout?: number;
  retry?: number | false;
  [key: string]: unknown;
}
export interface RbtApiResult<T> {
  code: number;
  data: T;
}
export interface RbtApi {
  request<TResponse, TBody = unknown>(options: RbtApiRequestOptions<TBody>): Promise<RbtApiResult<TResponse>>;
  get<TResponse>(path: string, options?: Omit<RbtApiRequestOptions, 'path' | 'method' | 'body'>): Promise<RbtApiResult<TResponse>>;
  post<TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RbtApiRequestOptions<TBody>, 'path' | 'method' | 'body'>): Promise<RbtApiResult<TResponse>>;
  put<TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RbtApiRequestOptions<TBody>, 'path' | 'method' | 'body'>): Promise<RbtApiResult<TResponse>>;
  patch<TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<RbtApiRequestOptions<TBody>, 'path' | 'method' | 'body'>): Promise<RbtApiResult<TResponse>>;
  del<TResponse>(path: string, options?: Omit<RbtApiRequestOptions, 'path' | 'method' | 'body'>): Promise<RbtApiResult<TResponse>>;
}

export interface RendererContext<TPageState> {
  apiVersion: 1;
  surface: 'round-page' | 'puzzle-page';
  rendererId?: string | null;
  readonly judgeActionConsts: Readonly<Ref<Readonly<Record<RbtJudgeAction, RbtJudgeActionConst>>>>;
  api: RbtApi;
  i18n: RbtThemeI18n;
  sync: {
    readonly time: RbtSyncTime;
    isSelfEcho(sid?: string): boolean;
    on<T extends RbtSyncMessageType>(type: T, callback: (message: RbtSyncMessage<T>) => void): () => void;
  };
  readonly utils: RbtThemeUtils;
  state: TPageState & {
    readonly currencies: Readonly<Ref<RbtCurrency[]>>;
    getCurrencies(): RbtCurrency[];
  };
  actions: {
    openPuzzle?(puzzle: PuzzleRef): Promise<void>;
    submitAnswer(answer: string, options?: { feedback?: SubmitFeedback }): Promise<JudgeResponse>;
    listSubmissions?(options?: { onlySuccessful?: boolean; page?: number }): Promise<RbtSubmissionPage>;
    refresh(): Promise<void>;
    navigate(target: string): Promise<void>;
    toast(options: { title?: string; description?: string; color?: string }): void;
  };
  routes: Record<string, (...args: any[]) => string>;
  content: {
    readonly blocks: RbtContentBlock[];
    mount(element: Element, blocks?: RbtContentBlock[]): () => void;
  };
  assets: { baseUrl: string; resolve(path: string): string };
  ui?: { apiVersion: 1; overlayRoot: HTMLElement; readonly locale: Readonly<Ref<unknown>>; install(app: App): void };
}
export type RoundThemeContext = RendererContext<{ readonly round: Readonly<Ref<RoundPageState>> }>;
export type PuzzleThemeContext = RendererContext<{ readonly puzzle: Readonly<Ref<PuzzlePageState>> }>;
