"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { generateHash } from "@/lib/hash";
import { uploadIdeaFile } from "@/lib/supabase";

export default function CaptureForm() {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [useLocation, setUseLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const { user } = useAuth();

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(latitude));
      url.searchParams.set("lon", String(longitude));

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });
      const data = await response.json();
      const address = data.address || {};
      const placeParts = [
        address.city || address.town || address.village || address.hamlet,
        address.state,
        address.country,
      ].filter(Boolean);
      return placeParts.length > 0 ? placeParts.join(", ") : data.display_name || null;
    } catch {
      return null;
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by your browser.");
      return;
    }

    setLocationFetching(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const name = await reverseGeocode(latitude, longitude);

        setLocation({
          latitude,
          longitude,
          name,
        });
        setLocationMessage(name ? `Location captured: ${name}` : "Location captured.");
        setLocationFetching(false);
      },
      () => {
        setLocationMessage("Could not get location. Please allow location access.");
        setLocationFetching(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || saving) return;

    setSaving(true);
    setFileMessage("");
    try {
      let uploadedFile = null;

      if (selectedFile) {
        setUploadingFile(true);
        setFileMessage("Uploading file...");
        uploadedFile = await uploadIdeaFile(selectedFile, user.uid);
        setFileMessage("File uploaded.");
      }

      // Generate a SHA-256 fingerprint of the idea
      const hash = await generateHash(content.trim());
      const ideaData = {
        content: content.trim(),
        hash: hash,
        visibility,
        ownerUid: user.uid,
        ownerName: user.displayName || user.email || "Anonymous",
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
      };
      if (useLocation && location) {
        ideaData.location = location;
      }
      if (uploadedFile) {
        ideaData.media = [
          {
            storage: "supabase",
            bucket: "ideas",
            path: uploadedFile.path,
            publicUrl: uploadedFile.publicUrl,
            mimeType: selectedFile.type,
            size: selectedFile.size,
          },
        ];
      }
      // Save the idea to Firestore
      await addDoc(collection(db, "users", user.uid, "ideas"), ideaData);
      setContent("");
      setSelectedFile(null);
      setFileMessage("");
    } catch (error) {
      console.error("Error saving idea:", error);
      setFileMessage("File upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's your idea?"
        className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[120px] text-gray-900 bg-white"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-slate-50">
          <input
            type="checkbox"
            checked={useLocation}
            onChange={(e) => setUseLocation(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-slate-900"
          />
          Use GPS location
        </label>
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={!useLocation || locationFetching}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {locationFetching ? "Locating..." : "Capture Location"}
        </button>
        {location && useLocation && (
          <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-950">
            {location.name || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          </span>
        )}
      </div>
      {locationMessage && <p className="mt-2 text-sm text-slate-500">{locationMessage}</p>}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <label className="mb-2 block font-medium text-slate-900">Optional file</label>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
        {selectedFile && <p className="mt-2 text-xs text-slate-500">Selected: {selectedFile.name}</p>}
        {fileMessage && <p className="mt-2 text-sm text-slate-500">{fileMessage}</p>}
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
        <label className="font-medium text-slate-900">Visibility</label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
              className="h-4 w-4 rounded border-gray-300 text-slate-900"
            />
            Private
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
              className="h-4 w-4 rounded border-gray-300 text-slate-900"
            />
            Public
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={!content.trim() || saving || uploadingFile}
        className="mt-3 w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving || uploadingFile ? "Capturing..." : "Capture Idea"}
      </button>
    </form>
  );
}