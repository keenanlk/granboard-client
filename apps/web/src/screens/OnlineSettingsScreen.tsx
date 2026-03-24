import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { supabase } from "../lib/supabaseClient.ts";
import { useOnlineStore } from "../store/useOnlineStore.ts";

interface OnlineSettingsScreenProps {
  onBack: () => void;
  onSignOut: () => void;
}

export function OnlineSettingsScreen({
  onBack,
  onSignOut,
}: OnlineSettingsScreenProps) {
  const storeDisplayName = useOnlineStore((s) => s.displayName);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dbName, setDbName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from session + DB on mount
  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const uid = session.user.id;
      setUserId(uid);

      // Load from DB first (source of truth for avatar + name)
      const { data } = await supabase
        .from("online_players")
        .select("display_name, avatar_url")
        .eq("id", uid)
        .single();

      if (data?.display_name) {
        setDbName(data.display_name);
      }

      // Avatar priority: DB (custom upload) > OAuth metadata
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      } else {
        const oauthUrl = session.user.user_metadata?.avatar_url as
          | string
          | undefined;
        if (oauthUrl) setAvatarUrl(oauthUrl);
      }
    })();
  }, []);

  // Resolved display name: DB > store > localStorage > "Player"
  const displayName =
    dbName ||
    storeDisplayName ||
    localStorage.getItem("nlc-online-name") ||
    "Player";

  function saveName() {
    const newName = nameInput.trim();
    if (!newName) return;
    setDbName(newName);
    localStorage.setItem("nlc-online-name", newName);
    useOnlineStore.setState({ displayName: newName });
    setEditing(false);

    // Persist to DB
    void (async () => {
      const uid =
        userId ?? (await supabase.auth.getSession()).data.session?.user?.id;
      if (!uid) return;
      await supabase
        .from("online_players")
        .update({ display_name: newName })
        .eq("id", uid);
    })();
  }

  async function handleAvatarUpload(file: File) {
    const uid =
      userId ?? (await supabase.auth.getSession()).data.session?.user?.id;
    if (!uid) return;

    setUploading(true);
    try {
      // Determine extension from MIME type
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `${uid}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("Avatar upload failed:", uploadError);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Cache-bust: append timestamp so the browser loads the new image
      const url = `${publicUrl}?t=${Date.now()}`;

      // Update DB
      await supabase
        .from("online_players")
        .update({ avatar_url: url })
        .eq("id", uid);

      setAvatarUrl(url);
    } finally {
      setUploading(false);
    }
  }

  // Initials fallback for avatar
  const initials = displayName
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 pb-4"
        style={{ paddingTop: "calc(var(--sat) + 1.5rem)" }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1
          className="text-3xl tracking-tight"
          style={{
            fontFamily: "Beon, sans-serif",
            color: "#f59e0b",
            textShadow:
              "0 0 20px #f59e0b, 0 0 60px #f59e0b, 0 0 100px rgba(245,158,11,0.5)",
          }}
        >
          Settings
        </h1>
      </div>

      <div className="flex-1 flex flex-col gap-6 px-6 overflow-y-auto">
        {/* Avatar with upload */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatarUpload(file);
              // Reset so the same file can be re-selected
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full border-2 border-zinc-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center">
                <span className="text-3xl font-black text-zinc-400">
                  {initials}
                </span>
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </button>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
            {uploading ? "Uploading..." : "Tap to change"}
          </p>
        </div>

        {/* Display Name */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-3">
            Display Name
          </p>
          {editing ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold uppercase tracking-widest text-lg focus:outline-none focus:border-amber-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nameInput.trim()) saveName();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveName}
                  disabled={!nameInput.trim()}
                  className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-black text-sm uppercase tracking-widest transition-colors active:bg-amber-700 disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-black text-sm uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setNameInput(displayName);
                setEditing(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 transition-colors hover:border-amber-600/50"
            >
              <span className="text-white font-bold uppercase tracking-widest text-lg">
                {displayName}
              </span>
              <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
                Edit
              </span>
            </button>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={() => {
            void supabase.auth.signOut().then(() => {
              onSignOut();
            });
          }}
          className="w-full py-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-400 font-black text-lg uppercase tracking-widest transition-colors active:bg-red-950/60"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
