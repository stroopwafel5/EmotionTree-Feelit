/**
 * friendsService.ts
 * --------------------------------------------------------------------------
 * Everything the app asks the Friends server: turning Friends on, friends,
 * friend requests, school groups and chats.
 *
 * The server's login token is saved on the device (per child account), so
 * the child stays connected.
 */
import { SERVER_URL } from '../config';
import type { HumanChoices } from '../models/Look';
import type { PetJson } from '../models/Pet';
import type { ProgressReport } from '../models/Rewards';
import type { UserJson } from '../models/User';
import { apiRequest } from './api';
import { deviceStorage, type KeyValueStore } from './storage';

/** The child's own Friends account. */
export interface Me extends UserJson {
  friendCode: string;
  verified: boolean;
  settings: { freeText: boolean; voice: boolean };
  parentEmailHint: string;
  /** True when a grown-up PIN was made. */
  hasPin?: boolean;
}

export interface FriendJson extends UserJson {
  unread: number;
}

export interface GroupJson {
  id: number;
  name: string;
  school: string;
  unread: number;
  members: UserJson[];
}

export interface FriendsOverview {
  me: Me;
  parent: { unread: number };
  /** Things waiting for this child's grown-up (friend requests, group invites). */
  grownUpWaiting?: number;
  friends: FriendJson[];
  groups: GroupJson[];
  /** Requests waiting for THIS child to say yes (parents already agreed). */
  incoming: { id: number; from: UserJson }[];
  /** Requests this child sent that are still waiting. */
  outgoing: OutgoingRequest[];
}

/** A friend request this child sent. stage: who still has to say yes. */
export interface OutgoingRequest {
  id: number;
  to: { username: string };
  stage: 'parents' | 'friend';
}

/** A chat the child can open: with their grown-up, a friend, or a school group. */
export type OpenChat =
  | { kind: 'parent'; ref: 'parent'; title: string }
  | { kind: 'friend'; ref: string; title: string; friend: UserJson }
  | { kind: 'group'; ref: string; title: string; group: GroupJson };

/** What the Grown-up corner shows (after the PIN). */
export interface GrownUpView {
  waiting: { type: 'friend' | 'group'; id: number; text: string }[];
  settings: { freeText: boolean; voice: boolean };
  verified: boolean;
  /** Worrying things the child told their space buddy (newest first). */
  alerts?: BuddyAlert[];
}

/** A worrying message from the space buddy chat (for the grown-up only). */
export interface BuddyAlert {
  id: number;
  at: string;
  /** "Someone is hurting them" */
  title: string;
  /** What the child typed. */
  text: string;
  /** The grown-up marked it as "talked about". */
  seen: boolean;
}

/** One chat message as the app gets it. */
export interface ChatMessage {
  id: number;
  kind: 'phrase' | 'feeling' | 'text' | 'voice' | 'hidden';
  phraseId?: string;
  feelingId?: string;
  text?: string;
  seconds?: number;
  hiddenKind?: 'text' | 'voice';
  from: { type: 'kid' | 'parent' | 'school'; id: number; name: string };
  createdAt: string;
  reported: boolean;
}

export interface ChatPage {
  messages: ChatMessage[];
  /** What this child may send here (follows the parents' settings). */
  allowed: { freeText: boolean; voice: boolean };
  members?: UserJson[];
}

/** Which chat: "parent", "friend-8" or "group-3". */
export type ChatRef = string;

/** Sending a typed message can be stopped by the safety filter. */
export type SendResult =
  | { message: ChatMessage }
  | { stopped: true; reason: string; message: string };

const tokenKey = (localUserId: number) => `friends.token.${localUserId}`;

/**
 * Adds new chat messages to the ones already shown: every message once,
 * oldest first (a message the child just sent may also come back from the
 * next refresh).
 */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  current.forEach(m => byId.set(m.id, m));
  incoming.forEach(m => byId.set(m.id, { ...byId.get(m.id), ...m }));
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export class FriendsService {
  constructor(private readonly store: KeyValueStore = deviceStorage) {}

  // ----- the saved login token (one per child account on this device) -----

  getToken(localUserId: number): Promise<string | null> {
    return this.store.getItem(tokenKey(localUserId));
  }

  async forget(localUserId: number): Promise<void> {
    await this.store.removeItem(tokenKey(localUserId));
  }

  /**
   * Turns on Friends for this child: a grown-up types the account password
   * and makes a 4-number grown-up PIN. Friends is on straight away (the
   * parent gets a heads-up email). Without a PIN, the parent must say yes
   * by email first.
   */
  async connect(
    localUserId: number,
    account: { username: string; email: string },
    password: string,
    pin?: string,
  ): Promise<Me> {
    const result = await apiRequest<{ token: string; me: Me }>('POST', '/api/connect', {
      body: { username: account.username, parentEmail: account.email, password, pin },
    });
    await this.store.setItem(tokenKey(localUserId), result.token);
    return result.me;
  }

  // ----- me -----

  async me(token: string): Promise<Me> {
    return (await apiRequest<{ me: Me }>('GET', '/api/me', { token })).me;
  }

  resendVerification(token: string) {
    return apiRequest('POST', '/api/me/resend-verification', { token });
  }

  saveProfile(token: string, look: HumanChoices, pet: PetJson) {
    return apiRequest('PUT', '/api/me/profile', { token, body: { look, pet } });
  }

  saveFeeling(token: string, feeling: string | null) {
    return apiRequest('PUT', '/api/me/feeling', { token, body: { feeling } });
  }

  /** The weekly check-up for the parent page (missions, streak, tests). */
  saveProgress(token: string, progress: ProgressReport) {
    return apiRequest('PUT', '/api/me/progress', { token, body: progress });
  }

  /** Emails the parent a link to the parent page. */
  emailParentLink(token: string) {
    return apiRequest('POST', '/api/parent-link', { token });
  }

  // ----- Grown-up corner (every call carries the grown-up PIN) -----

  grownUp(token: string, pin: string): Promise<GrownUpView> {
    return apiRequest<GrownUpView>('POST', '/api/grownup', { token, body: { pin } });
  }

  grownUpDecide(token: string, pin: string, type: 'friend' | 'group', id: number, approve: boolean) {
    return apiRequest<GrownUpView>('POST', '/api/grownup/decide', {
      token,
      body: { pin, type, id, decision: approve ? 'approve' : 'decline' },
    });
  }

  grownUpSettings(token: string, pin: string, settings: { freeText?: boolean; voice?: boolean }) {
    return apiRequest<GrownUpView>('POST', '/api/grownup/settings', { token, body: { pin, ...settings } });
  }

  /** The grown-up talked with the child about a space buddy worry. */
  grownUpAlertSeen(token: string, pin: string, id: number) {
    return apiRequest<GrownUpView>('POST', '/api/grownup/alert-seen', { token, body: { pin, id } });
  }

  changePin(token: string, pin: string, newPin: string) {
    return apiRequest('POST', '/api/grownup/pin', { token, body: { pin, newPin } });
  }

  /** A one-time link that opens the parent page in the browser (no email needed). */
  async parentPageUrl(token: string, pin: string): Promise<string> {
    const { path } = await apiRequest<{ path: string }>('POST', '/api/grownup/parent-page', { token, body: { pin } });
    return `${SERVER_URL}${path}`;
  }

  // ----- friends and groups -----

  overview(token: string): Promise<FriendsOverview> {
    return apiRequest<FriendsOverview>('GET', '/api/friends', { token });
  }

  /** Asks to be friends. The server emails BOTH parents. */
  requestFriend(token: string, friendCode: string) {
    return apiRequest<{ request: OutgoingRequest }>('POST', '/api/friends/requests', {
      token,
      body: { friendCode },
    });
  }

  answerRequest(token: string, id: number, action: 'accept' | 'decline' | 'cancel') {
    return apiRequest('POST', `/api/friends/requests/${id}/${action}`, { token });
  }

  removeFriend(token: string, friendId: number) {
    return apiRequest('DELETE', `/api/friends/${friendId}`, { token });
  }

  leaveGroup(token: string, groupId: number) {
    return apiRequest('POST', `/api/groups/${groupId}/leave`, { token });
  }

  // ----- chats -----

  messages(token: string, ref: ChatRef, afterId = 0): Promise<ChatPage> {
    return apiRequest<ChatPage>('GET', `/api/chats/${ref}/messages?after=${afterId}`, { token });
  }

  sendPhrase(token: string, ref: ChatRef, phraseId: string): Promise<SendResult> {
    return apiRequest('POST', `/api/chats/${ref}/messages`, { token, body: { kind: 'phrase', phraseId } });
  }

  sendFeeling(token: string, ref: ChatRef, feelingId: string): Promise<SendResult> {
    return apiRequest('POST', `/api/chats/${ref}/messages`, { token, body: { kind: 'feeling', feelingId } });
  }

  sendText(token: string, ref: ChatRef, text: string): Promise<SendResult> {
    return apiRequest('POST', `/api/chats/${ref}/messages`, { token, body: { kind: 'text', text } });
  }

  /** Uploads a voice recording (the file the recorder made). */
  sendVoice(token: string, ref: ChatRef, fileUri: string, seconds: number): Promise<SendResult> {
    const form = new FormData();
    // React Native uploads a file from its uri like this:
    form.append('voice', { uri: fileUri, type: 'audio/mp4', name: 'voice.m4a' } as unknown as Blob);
    form.append('seconds', String(seconds));
    return apiRequest('POST', `/api/chats/${ref}/voice`, { token, form });
  }

  /** "Tell my grown-up" about a message. */
  report(token: string, messageId: number) {
    return apiRequest('POST', `/api/messages/${messageId}/report`, { token });
  }

  /** Where to listen to a voice message, and the login header to send. */
  voiceSource(token: string, messageId: number) {
    return { url: `${SERVER_URL}/api/voice/${messageId}`, headers: { Authorization: `Bearer ${token}` } };
  }
}

export const friendsService = new FriendsService();
