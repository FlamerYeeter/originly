"use client";

import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MediaPreview from "@/components/MediaPreview";
import Link from "next/link";
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
  const recordingCanvasRef = useRef(null);
  const recordingAnimationRef = useRef(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const watermarkEnabled = true;
  const watermarkText = "Made in Originly";
  const objectUrlsRef = useRef([]);
  const [category, setCategory] = useState("Idea");
  const [tagsInput, setTagsInput] = useState("");
  const { user } = useAuth();
  const formRef = useRef(null);

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
    try {
      if (recordingAnimationRef.current) {
        cancelAnimationFrame(recordingAnimationRef.current);
        recordingAnimationRef.current = null;
      }
    } catch (err) {}
    // stop any canvas capture tracks
    try {
      if (recordingCanvasRef.current) {
        recordingCanvasRef.current.getContext && recordingCanvasRef.current.getContext("2d");
        recordingCanvasRef.current = null;
      }
    } catch (err) {}
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
      setShowAudioRecorder(false);
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  useEffect(() => {
    if (showCamera && mediaStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = mediaStream;
      video.muted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {});
      }
    }
  }, [mediaStream, showCamera]);

  const takePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      await new Promise((resolve) => {
        const handleLoaded = () => {
          video.removeEventListener("loadedmetadata", handleLoaded);
          resolve();
        };
        video.addEventListener("loadedmetadata", handleLoaded);
      });
    }
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Draw watermark text if enabled
    if (watermarkEnabled && watermarkText) {
      try {
        const fontSize = Math.max(16, Math.round(canvas.width / 40));
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.textBaseline = "bottom";
        const text = watermarkText;
        const padding = Math.round(fontSize * 0.6);
        const textWidth = ctx.measureText(text).width;
        const x = canvas.width - textWidth - padding;
        const y = canvas.height - padding;
        // draw subtle shadow for contrast
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillText(text, x + 2, y + 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(text, x, y);
      } catch (err) {
        // ignore watermark drawing errors
      }
    }
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    if (blob) {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: blob.type });
      setSelectedFiles((s) => [...s, file]);
    }
    stopAndCleanupStream();
  };

  const requestVideoAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "environment" },
      });
      setMediaStream(stream);
      setShowAudioRecorder(false);
      setShowCamera(true);
      return stream;
    } catch (err) {
      console.error("Video capture error", err);
      return null;
    }
  };

  const startRecording = async ({ audioOnly = false } = {}) => {
    let stream = mediaStream;

    if (!stream) {
      if (audioOnly) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMediaStream(stream);
          setShowAudioRecorder(true);
        } catch (err) {
          console.error("Audio capture error", err);
          return;
        }
      } else {
        stream = await requestVideoAudioStream();
      }
    }

    if (!audioOnly && stream && stream.getAudioTracks().length === 0) {
      stopAndCleanupStream();
      stream = await requestVideoAudioStream();
    }

    if (!stream) return;

    recordedChunksRef.current = [];
    try {
      if (audioOnly) {
        const options = { mimeType: "audio/webm" };
        const mr = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        mr.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || "audio/webm" });
          const ext = "webm";
          const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: blob.type });
          setSelectedFiles((s) => [...s, file]);
          stopAndCleanupStream();
        };
        mr.start();
        setIsRecording(true);
      } else {
        // Composite video frames to a canvas so we can draw a watermark on each frame
        // Ensure the video element exists and has metadata before sizing canvas
        let video = videoRef.current;
        if (!video) {
          // wait up to ~2s for the video element to mount
          await new Promise((resolve) => {
            let elapsed = 0;
            const check = () => {
              video = videoRef.current;
              if (video) return resolve();
              elapsed += 50;
              if (elapsed > 2000) return resolve();
              setTimeout(check, 50);
            };
            check();
          });
          video = videoRef.current;
        }

        const waitForMetadata = (vid) =>
          new Promise((resolve) => {
            if (!vid) return resolve();
            if (vid.videoWidth && vid.videoHeight) return resolve();
            const onLoaded = () => {
              try {
                vid.removeEventListener("loadedmetadata", onLoaded);
              } catch (e) {}
              resolve();
            };
            vid.addEventListener("loadedmetadata", onLoaded);
            // fallback resolve after 1.5s
            setTimeout(() => {
              try {
                vid.removeEventListener("loadedmetadata", onLoaded);
              } catch (e) {}
              resolve();
            }, 1500);
          });

        await waitForMetadata(video);

        const canvas = recordingCanvasRef.current || document.createElement("canvas");
        canvas.width = (video && video.videoWidth) || 1280;
        canvas.height = (video && video.videoHeight) || 720;
        recordingCanvasRef.current = canvas;
        const ctx = canvas.getContext("2d");

        const drawFrame = () => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (watermarkEnabled && watermarkText) {
              const fontSize = Math.max(16, Math.round(canvas.width / 40));
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textBaseline = "bottom";
              const text = watermarkText;
              const padding = Math.round(fontSize * 0.6);
              const textWidth = ctx.measureText(text).width;
              const x = canvas.width - textWidth - padding;
              const y = canvas.height - padding;
              ctx.fillStyle = "rgba(0,0,0,0.45)";
              ctx.fillText(text, x + 2, y + 2);
              ctx.fillStyle = "rgba(255,255,255,0.9)";
              ctx.fillText(text, x, y);
            }
          } catch (err) {
            // ignore drawing errors
          }
          recordingAnimationRef.current = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        const canvasStream = canvas.captureStream(30);
        // combine audio tracks, if present
        let composedStream = canvasStream;
        if (stream && stream.getAudioTracks && stream.getAudioTracks().length > 0) {
          composedStream = new MediaStream([...canvasStream.getVideoTracks(), ...stream.getAudioTracks()]);
        }

        const options = { mimeType: "video/webm;codecs=vp8,opus" };
        const mr = new MediaRecorder(composedStream, options);
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        mr.onstop = async () => {
          try {
            if (recordingAnimationRef.current) {
              cancelAnimationFrame(recordingAnimationRef.current);
              recordingAnimationRef.current = null;
            }
          } catch (err) {}

          const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || "video/webm" });
          const ext = "webm";
          const file = new File([blob], `video-${Date.now()}.${ext}`, { type: blob.type });
          setSelectedFiles((s) => [...s, file]);
          stopAndCleanupStream();
        };
        mr.start();
        setIsRecording(true);
      }
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
    <div className="min-h-screen flex flex-col bg-transparent">
      <form ref={formRef} onSubmit={handleSubmit} className="w-full flex-1 overflow-auto p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's your idea?"
        className="w-full p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/60 min-h-[80px] sm:min-h-[120px] text-foreground bg-surface"
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
        className="w-full mt-3 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60 text-foreground bg-surface"
      />
      {titleError && <p className="mt-1 text-xs text-rose-400">{titleError}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground bg-surface-2">
          <input
            type="checkbox"
            checked={useLocation}
            onChange={(e) => setUseLocation(e.target.checked)}
            className="h-4 w-4 rounded border-border text-foreground"
          />
          Use GPS location
        </label>
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={!useLocation || locationFetching}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {locationFetching ? "Locating..." : "Capture Location"}
        </button>
        {location && useLocation && (
          <span className="rounded-full bg-surface px-3 py-2 text-sm text-foreground">
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
              if (showCamera) {
                stopAndCleanupStream();
              } else {
                if (showAudioRecorder) stopAndCleanupStream();
                startCamera({ forVideo: false });
              }
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            {showCamera ? "Close Camera" : "Camera"}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                if (showCamera) stopAndCleanupStream();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMediaStream(stream);
                setShowAudioRecorder(true);
                setShowCamera(false);
              } catch (err) {
                console.error(err);
              }
            }}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground bg-surface hover:bg-surface-2"
          >
            Audio
          </button>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Watermark "Made in Originly" is permanently applied to captures to help attribution and provenance.
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
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="mb-2 text-sm font-medium text-foreground">Audio Recorder</div>
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={() => startRecording({ audioOnly: true })}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
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
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground bg-surface hover:bg-surface-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-3 text-sm text-muted">
        <label className="mb-2 block font-medium text-foreground">Optional files</label>
        <input
          type="file"
          multiple
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.csv,.ppt,.pptx"
          onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
          className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
        />
        <p className="mt-2 text-xs text-muted">You can attach images, audio, video, or documents.</p>
        {selectedFiles.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-xs text-slate-500">
            {selectedFiles.map((file) => (
              <li key={`${file.name}-${file.size}`}>{file.name}</li>
            ))}
          </ul>
        )}
        {fileMessage && <p className="mt-2 text-sm text-slate-500">{fileMessage}</p>}
        <MediaPreview media={previewMedia} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} />
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
        <label className="font-medium text-foreground">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mb-3 rounded-md border border-border bg-surface p-2 text-sm text-foreground"
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
        <label className="font-medium text-foreground">Tags</label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="mb-3 rounded-md border border-border bg-surface p-2 text-sm text-foreground w-full"
        />
        <label className="font-medium text-foreground">Visibility</label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
              className="h-4 w-4 rounded border-border text-foreground"
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
              className="h-4 w-4 rounded border-border text-foreground"
            />
            Public
          </label>
        </div>
      </div>
      </form>

      {/* Mobile bottom action bar */}
      <div className="mobile-bottom-bar fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area">
        <div className="container-max flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
                <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 21V12h14v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => {
                if (showCamera) {
                  stopAndCleanupStream();
                } else {
                  if (showAudioRecorder) stopAndCleanupStream();
                  startCamera({ forVideo: false });
                }
              }}
              className="rounded-full bg-slate-900 p-3 text-white shadow-lg"
              aria-label="Toggle camera"
            >
              📷
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isRecording) startRecording({ audioOnly: false });
                else stopRecording();
              }}
              className={`rounded-full p-3 text-white shadow-lg ${isRecording ? 'bg-amber-500' : 'bg-rose-500'}`}
              aria-label="Record video"
            >
              {isRecording ? '⏹' : '●'}
            </button>
          </div>

          <div className="flex-1 px-3">
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={!content.trim() || saving || uploadingFiles}
              className="w-full rounded-full bg-gray-900 text-white py-3 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || uploadingFiles ? "Capturing..." : "Capture Idea"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/community" className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM21 21v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}