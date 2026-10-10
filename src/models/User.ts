/**
 * User.ts
 * --------------------------------------------------------------------------
 * A child in the Friends world: their avatar, their space buddy, how they
 * feel right now, and their friends.
 *
 * Brief:  User (int id, User[] friends, Look look, Pet pet)
 *
 * Added on top of the brief:
 *  - username   : the name friends see
 *  - feeling    : how the child feels right now (an id from feelings.json,
 *                 e.g. "happy"), shown on the avatar's face and in a bubble
 *  - friendCode : the code friends type to add this child (only known for
 *                 the child themselves)
 */
import { getFeeling, type Feeling } from '../services/feelings';
import { Look, type HumanChoices } from './Look';
import { Pet, type PetJson } from './Pet';

/** A child as the server sends it. */
export interface UserJson {
  id: number;
  username: string;
  look: Partial<HumanChoices> | null;
  pet: Partial<PetJson> | null;
  feeling: string | null;
  friendCode?: string;
}

export class User {
  /**
   * @param id       The child's number on the Friends server.
   * @param friends  The child's friends (each one is a User too).
   * @param look     The child's avatar (isHuman = true).
   * @param pet      The child's space buddy.
   * @param username Name shown to friends (added).
   * @param feeling  Feeling id, or null (added).
   */
  constructor(
    public id: number,
    public friends: User[],
    public look: Look,
    public pet: Pet,
    public username: string = '',
    public feeling: string | null = null,
    public friendCode: string = '',
  ) {}

  /** The feeling with its emoji and name, or null. */
  getFeeling(): Feeling | null {
    return this.feeling ? getFeeling(this.feeling) ?? null : null;
  }

  /** Sets how the child feels (must be an id from feelings.json, or null). */
  setFeeling(feelingId: string | null): void {
    if (feelingId !== null && !getFeeling(feelingId)) {
      throw new Error(`Unknown feeling: ${feelingId}`);
    }
    this.feeling = feelingId;
  }

  /** Finds a friend by id. */
  getFriend(id: number): User | undefined {
    return this.friends.find(friend => friend.id === id);
  }

  /** Builds a User from server data (friends are added separately). */
  static fromJson(json: UserJson, friends: User[] = []): User {
    return new User(
      json.id,
      friends,
      Look.safeHuman(json.id, json.look),
      Pet.fromJson(json.id, json.pet),
      json.username,
      json.feeling,
      json.friendCode ?? '',
    );
  }
}
