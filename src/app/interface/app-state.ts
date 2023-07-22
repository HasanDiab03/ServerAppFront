import { DataState } from "../enum/data-state.enum";

export interface AppState<Generic> { // to capture the state of the app at any given moment
  dataState: DataState;
  appData?: Generic; // optional since we can have data or error and not both
  error?: string;
}
