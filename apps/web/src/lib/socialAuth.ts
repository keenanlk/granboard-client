import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabaseClient.ts";

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

let googleAuthInitialized = false;

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (isNativePlatform()) {
    try {
      const { GoogleAuth } =
        await import("@codetrix-studio/capacitor-google-auth");
      if (!googleAuthInitialized) {
        GoogleAuth.initialize();
        googleAuthInitialized = true;
      }
      const result = await GoogleAuth.signIn();
      const idToken =
        result.authentication?.idToken ?? result.authentication?.accessToken;
      if (!idToken) return { error: "No ID token received from Google" };

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) return { error: error.message };
      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Google sign-in failed",
      };
    }
  }

  // Web: use OAuth redirect flow
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });
  if (error) return { error: error.message };
  return {};
}

export async function signInWithApple(): Promise<{ error?: string }> {
  if (!isNativePlatform()) {
    return { error: "Apple sign-in is only available on iOS" };
  }

  try {
    const { SignInWithApple } =
      await import("@capacitor-community/apple-sign-in");
    const result = await SignInWithApple.authorize({
      clientId: "com.keenankaufman.nlcdarts",
      redirectURI: "",
      scopes: "email name",
    });

    const idToken = result.response?.identityToken;
    if (!idToken) return { error: "No identity token received from Apple" };

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: idToken,
    });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Apple sign-in failed",
    };
  }
}
