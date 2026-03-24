import { SupabaseConnectionManager } from "./SupabaseConnectionManager.ts";
import { ColyseusConnectionManager } from "./ColyseusConnectionManager.ts";
import { TournamentConnectionManager } from "./TournamentConnectionManager.ts";
import type { OnlineStoreState } from "../store/online.types.ts";

type StoreWriter = (partial: Partial<OnlineStoreState>) => void;
type StoreReader = () => OnlineStoreState;

let supabaseMgr: SupabaseConnectionManager | null = null;
let colyseusMgr: ColyseusConnectionManager | null = null;
let tournamentMgr: TournamentConnectionManager | null = null;

let boundGetState: StoreReader | null = null;
let boundSetState: StoreWriter | null = null;

/**
 * Must be called once after the Zustand store is created
 * to wire managers to the store.
 */
export function bindManagersToStore(
  getState: StoreReader,
  setState: StoreWriter,
): void {
  boundGetState = getState;
  boundSetState = setState;

  // If managers already exist, rebind them
  if (supabaseMgr) supabaseMgr.bindStore(getState, setState);
  if (colyseusMgr) colyseusMgr.bindStore(setState);
  if (tournamentMgr) tournamentMgr.bindStore(setState);
}

export function getSupabaseManager(): SupabaseConnectionManager {
  if (!supabaseMgr) {
    if (!boundGetState || !boundSetState) {
      throw new Error(
        "Managers not bound to store — call bindManagersToStore first",
      );
    }
    supabaseMgr = new SupabaseConnectionManager(boundGetState, boundSetState);
  }
  return supabaseMgr;
}

export function getColyseusManager(): ColyseusConnectionManager {
  if (!colyseusMgr) {
    if (!boundSetState) {
      throw new Error(
        "Managers not bound to store — call bindManagersToStore first",
      );
    }
    colyseusMgr = new ColyseusConnectionManager(boundSetState);
  }
  return colyseusMgr;
}

export function getTournamentManager(): TournamentConnectionManager {
  if (!tournamentMgr) {
    if (!boundSetState) {
      throw new Error(
        "Managers not bound to store — call bindManagersToStore first",
      );
    }
    tournamentMgr = new TournamentConnectionManager(boundSetState);
  }
  return tournamentMgr;
}

/** Tear down all managers. Called by goOffline() and on app teardown. */
export function cleanupAllManagers(): void {
  supabaseMgr?.cleanup();
  colyseusMgr?.cleanup();
  tournamentMgr?.cleanup();
}
