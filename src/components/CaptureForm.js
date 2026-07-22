"use client";

import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MediaPreview from "@/components/MediaPreview";
import { useAuth } from "@/context/AuthContext";
import { generateHash } from "@/lib/hash";
import { uploadIdeaFiles } from "@/lib/supabase";

export default function CaptureForm() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [useLocation, setUseLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewMedia, setPreviewMedia] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const objectUrlsRef = useRef([]);
  const [category, setCategory] = useState("Idea");
  const [tagsInput, setTagsInput] = useState("");
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
      let uploadedFiles = [];

      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        setFileMessage("Uploading files...");
        // If selectedFiles contains already-uploaded metadata objects, filter to File instances
        const filesToUpload = selectedFiles.filter((f) => f instanceof File);
        if (filesToUpload.length > 0) {
          const uploaded = await uploadIdeaFiles(filesToUpload, user.uid);
          // replace File instances in selectedFiles with uploaded metadata
          const updatedFiles = [];
          let uploadIndex = 0;
          for (const f of selectedFiles) {
            if (f instanceof File) {
              updatedFiles.push(uploaded[uploadIndex++] || f);
            } else {
              updatedFiles.push(f);
            }
          }
          uploadedFiles = updatedFiles.filter((f) => f.path || f.publicUrl ? true : false);
          setSelectedFiles(updatedFiles);
        } else {
          uploadedFiles = selectedFiles;
        }
        setFileMessage(uploadedFiles.length === 1 ? "File uploaded." : "Files uploaded.");
      }

      // Validate title length
      if (title.trim().length > 120) {
        setTitleError("Title must be 120 characters or less.");
        setSaving(false);
        return;
      }
      setTitleError("");

      // Generate a SHA-256 fingerprint of the idea
      const hash = await generateHash(content.trim());
      const ideaData = {
        title: title.trim(),
        content: content.trim(),
        hash: hash,
        category,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20),
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
      if (uploadedFiles.length > 0) {
        ideaData.media = uploadedFiles.map((file) => ({
          storage: "supabase",
          bucket: "ideas",
          path: file.path,
          publicUrl: file.publicUrl,
          mimeType: file.mimeType,
          size: file.size,
          name: file.name,
        }));
      }
      // Save the idea to Firestore
      const docRef = await addDoc(collection(db, "users", user.uid, "ideas"), ideaData);
      // persist origin ID and initial version metadata
      await updateDoc(docRef, {
        originId: docRef.id,
        version: "v1",
        versionNumber: 1,
      });
      setTitle("");
      setTagsInput("");
      setContent("");
      setSelectedFiles([]);
      setFileMessage("");
    } catch (error) {
      console.error("Error saving idea:", error);
      setFileMessage("File upload failed. Please try again.");
    } finally {
      setUploadingFiles(false);
      setSaving(false);
    }
  };

  // Generate preview media for selectedFiles (object URLs for local files)
  useEffect(() => {
    // cleanup previous object URLs
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];

    const previews = selectedFiles
      .map((f) => {
        if (!f) return null;
        if (f.publicUrl) return f;
        if (f instanceof File) {
          const url = URL.createObjectURL(f);
          objectUrlsRef.current.push(url);
          return { publicUrl: url, mimeType: f.type, name: f.name };
        }
        return null;
      })
      .filter(Boolean);

    setPreviewMedia(previews);

    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, [selectedFiles]);

  // Auto-upload any newly-captured File objects to Supabase and replace them with uploaded metadata
  useEffect(() => {
    let cancelled = false;
    const uploadLocalFiles = async () => {
      if (!user || !selectedFiles || selectedFiles.length === 0) return;
      const filesToUpload = selectedFiles.filter((f) => f instanceof File);
      if (filesToUpload.length === 0) return;
      setUploadingFiles(true);
      setFileMessage("Uploading captured media...");
      try {
        const uploaded = await uploadIdeaFiles(filesToUpload, user.uid);
        if (cancelled) return;
        // replace in order by matching name+size
        const updated = selectedFiles.map((item) => {
          if (item instanceof File) {
            const matchIndex = uploaded.findIndex((u) => u.name === item.name && u.size === item.size);
            if (matchIndex !== -1) {
              const [m] = uploaded.splice(matchIndex, 1);
              return m;
            }
            return item;
          }
          return item;
        });
        setSelectedFiles(updated);
        setFileMessage("Captured media uploaded.");
      } catch (err) {
        console.error("Upload captured media failed", err);
        setFileMessage("Failed to upload captured media.");
      } finally {
        setUploadingFiles(false);
      }
    };

    uploadLocalFiles();

    return () => {
      cancelled = true;
    };
  }, [selectedFiles, user]);

  // --- Simple media helpers for on-the-spot captures ---
  const stopAndCleanupStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setShowCamera(false);
    setShowAudioRecorder(false);
    setIsRecording(false);
  };

  const startCamera = async ({ forVideo = false } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: forVideo ? true : false,
        video: { facingMode: "environment" },
      });
      setMediaStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    if (blob) {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: blob.type });
      setSelectedFiles((s) => [...s, file]);
    }
    stopAndCleanupStream();
  };

  const startRecording = ({ audioOnly = false } = {}) => {
    if (!mediaStream) return;
    recordedChunksRef.current = [];
    try {
      const options = { mimeType: audioOnly ? "audio/webm" : "video/webm;codecs=vp8,opus" };
      const mr = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || (audioOnly ? "audio/webm" : "video/webm") });
        const ext = audioOnly ? "webm" : "webm";
        const file = new File([blob], `${audioOnly ? "audio" : "video"}-${Date.now()}.${ext}`, { type: blob.type });
        setSelectedFiles((s) => [...s, file]);
        stopAndCleanupStream();
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error("MediaRecorder error", err);
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    };
  }, [mediaStream]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's your idea?"
        className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[120px] text-gray-900 bg-white"
      />
      <input
        value={title}
        onChange={(e) => {
          const v = e.target.value;
          setTitle(v);
          setTitleError(v.trim().length > 120 ? "Title must be 120 characters or less." : "");
        }}
        placeholder="Title (optional)"
        maxLength={120}
        className="w-full mt-3 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 bg-white"
      />
      {titleError && <p className="mt-1 text-xs text-rose-400">{titleError}</p>}
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
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              startCamera({ forVideo: false });
              setShowAudioRecorder(false);
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 bg-white hover:bg-slate-50"
          >
            Take Photo
          </button>
          <button
            type="button"
            onClick={async () => {
              await startCamera({ forVideo: true });
              setShowAudioRecorder(false);
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 bg-white hover:bg-slate-50"
          >
            Record Video
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMediaStream(stream);
                setShowAudioRecorder(true);
                setShowCamera(false);
              } catch (err) {
                console.error(err);
              }
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 bg-white hover:bg-slate-50"
          >
            Record Audio
          </button>
        </div>

        {showCamera && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-sm font-medium text-slate-900">Camera</div>
            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-md bg-black" />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={takePhoto}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Take Photo
              </button>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={() => startRecording({ audioOnly: false })}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Start Video
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={stopAndCleanupStream}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {showAudioRecorder && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-sm font-medium text-slate-900">Audio Recorder</div>
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={() => startRecording({ audioOnly: true })}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={stopAndCleanupStream}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <label className="mb-2 block font-medium text-slate-900">Optional files</label>
        <input
          type="file"
          multiple
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.csv,.ppt,.pptx"
          onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
        <p className="mt-2 text-xs text-slate-500">You can attach images, audio, video, or documents.</p>
        {selectedFiles.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-xs text-slate-500">
            {selectedFiles.map((file) => (
              <li key={`${file.name}-${file.size}`}>{file.name}</li>
            ))}
          </ul>
        )}
        {fileMessage && <p className="mt-2 text-sm text-slate-500">{fileMessage}</p>}
        <MediaPreview media={previewMedia} />
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
        <label className="font-medium text-slate-900">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mb-3 rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900"
        >
          <option>💡 Idea</option>
          <option>🎵 Music Lyrics</option>
          <option>🎼 Music Riff (audio)</option>
          <option>📄 Story</option>
          <option>🎬 Script</option>
          <option>🎨 Artwork</option>
          <option>📷 Image</option>
          <option>📹 Video</option>
          <option>📁 Document</option>
        </select>
        <label className="font-medium text-slate-900">Tags</label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="mb-3 rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 w-full"
        />
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
        disabled={!content.trim() || saving || uploadingFiles}
        className="mt-3 w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving || uploadingFiles ? "Capturing..." : "Capture Idea"}
      </button>
    </form>
  );
}