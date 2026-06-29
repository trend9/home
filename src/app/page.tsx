"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Wifi, WifiOff, Scan, Edit2, User, Clock } from "lucide-react";

interface Device {
  id: string; // MAC address
  name: string;
  is_online: boolean;
  last_seen: any;
}

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Renaming modal state
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    // Listen to devices
    const unsubscribe = onSnapshot(collection(db, "devices"), (snapshot) => {
      const devs: Device[] = [];
      snapshot.forEach((doc) => {
        devs.push({ id: doc.id, ...doc.data() } as Device);
      });
      // Sort by online status first, then by name (Unknown at the bottom)
      devs.sort((a, b) => {
        const nameA = a.name || "Unknown";
        const nameB = b.name || "Unknown";
        
        if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
        if (nameA === "Unknown" && nameB !== "Unknown") return 1;
        if (nameA !== "Unknown" && nameB === "Unknown") return -1;
        return nameA.localeCompare(nameB);
      });
      setDevices(devs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const requestScan = async () => {
    try {
      await setDoc(doc(db, "requests", "scan"), { trigger: true }, { merge: true });
      alert("Scan requested! Unknown devices will appear shortly.");
    } catch (e) {
      console.error(e);
      alert("Error requesting scan. Check configuration.");
    }
  };

  const updateDeviceName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice || !newName) return;
    try {
      await updateDoc(doc(db, "devices", editingDevice), {
        name: newName.trim(),
      });
      setEditingDevice(null);
      setNewName("");
    } catch (e) {
      console.error(e);
      alert("Error updating device name");
    }
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device.id);
    const name = device.name || "Unknown";
    setNewName(name === "Unknown" ? "" : name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white p-6 pb-24">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-10 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Wifi className="text-indigo-400 w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                Home Radar
              </h1>
              <p className="text-xs text-slate-400">Passive Wi-Fi Tracking</p>
            </div>
          </div>
          <button
            onClick={requestScan}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 rounded-xl transition-all active:scale-95 text-indigo-300 text-sm font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)]"
          >
            <Scan className="w-4 h-4" />
            Scan
          </button>
        </header>

        <div className="space-y-4">
          {devices.length === 0 ? (
            <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <p className="text-slate-400 text-sm">No devices found. Press Scan to search.</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={`relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
                  device.is_online
                    ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.1)]"
                    : "bg-white/5 border-white/10 opacity-75 grayscale-[30%]"
                }`}
              >
                {device.is_online && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                )}
                
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                        device.is_online
                          ? device.name === "Unknown"
                            ? "bg-slate-700 text-slate-300"
                            : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className={`font-semibold text-lg ${(!device.name || device.name === "Unknown") ? "text-slate-400 italic" : ""}`}>
                        {device.name || "Unknown"}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {device.is_online ? "Active Now" : "Away"}
                        <span className="opacity-50 ml-1">({device.id})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {device.is_online ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Home
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400 text-xs font-medium">
                        <WifiOff className="w-3 h-3" />
                        Away
                      </div>
                    )}
                    <button
                      onClick={() => openEditModal(device)}
                      className="text-slate-400 hover:text-white transition-colors p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {editingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl scale-in-center">
              <h3 className="text-xl font-bold mb-4">Rename Device</h3>
              <form onSubmit={updateDeviceName} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">New Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Papa's iPhone"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingDevice(null)}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    Save Name
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
