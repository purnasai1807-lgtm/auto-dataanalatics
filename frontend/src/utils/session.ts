import { setStoredToken, setStoredUser } from "../api/client";
import { DemoAuthResponse, TokenResponse } from "../api/types";

export function applyAuthSession(payload: TokenResponse | DemoAuthResponse) {
  setStoredToken(payload.access_token);
  setStoredUser(payload.user);
}
