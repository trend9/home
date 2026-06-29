"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Wifi, WifiOff, Scan, Edit2, User, Clock, Heart, Home as HomeIcon } from "lucide-react";

interface Device {
  id: string; // MAC address
  name: string;
  owner?: string;
  color?: string;
  is_online: boolean;
  last_seen: any;
  ip?: string;
}

const OWNERS = ["父", "母", "ちさこ", "とし", "TV", "PC"];

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  pink: { bg: "bg-pink-200", text: "text-pink-600", ring: "ring-pink-300" },
  purple: { bg: "bg-purple-200", text: "text-purple-600", ring: "ring-purple-300" },
  blue: { bg: "bg-blue-200", text: "text-blue-600", ring: "ring-blue-300" },
  emerald: { bg: "bg-emerald-200", text: "text-emerald-600", ring: "ring-emerald-300" },
  amber: { bg: "bg-amber-200", text: "text-amber-600", ring: "ring-amber-300" },
  cyan: { bg: "bg-cyan-200", text: "text-cyan-600", ring: "ring-cyan-300" },
};

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Renaming modal state
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newColor, setNewColor] = useState("pink");
  
  // Dashboard state
  const [lastScan, setLastScan] = useState<Date | null>(null);

  useEffect(() => {
    // Listen to devices
    const unsubscribe = onSnapshot(collection(db, "devices"), (snapshot) => {
      const devs: Device[] = [];
      snapshot.forEach((doc) => {
        devs.push({ id: doc.id, ...doc.data() } as Device);
      });
      // Sort by online status first, then by name
      devs.sort((a, b) => {
        const nameA = a.name || "Unknown";
        const nameB = b.name || "Unknown";
        if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
        return nameA.localeCompare(nameB);
      });
      setDevices(devs);
      setLoading(false);
    });

    // Listen to system status
    const unsubStatus = onSnapshot(doc(db, "system", "status"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.last_scan) {
          setLastScan(data.last_scan.toDate());
        }
      }
    });

    return () => {
      unsubscribe();
      unsubStatus();
    };
  }, []);



  const requestScan = async () => {
    try {
      await setDoc(doc(db, "requests", "scan"), { trigger: true }, { merge: true });
      alert("ネットワークを探しています！少しお待ちください🌸");
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    }
  };

  const updateDeviceName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice || !newName) return;
    try {
      await updateDoc(doc(db, "devices", editingDevice), {
        name: newName.trim(),
        owner: newOwner,
        color: newColor,
      });
      setEditingDevice(null);
      setNewName("");
      setNewOwner("");
      setNewColor("pink");
    } catch (e) {
      console.error(e);
      alert("更新エラー");
    }
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device.id);
    const name = device.name || "Unknown";
    setNewName(name === "Unknown" ? "" : name);
    setNewOwner(device.owner || "");
    setNewColor(device.color || "pink");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF0F5] flex items-center justify-center">
        <Heart className="w-12 h-12 text-pink-400 animate-pulse" />
      </div>
    );
  }

  // Group devices
  const groupedDevices: Record<string, Device[]> = {
    "父": [], "母": [], "ちさこ": [], "とし": [], "TV": [], "PC": [], "未登録": []
  };

  devices.forEach(d => {
    const owner = d.owner || "未登録";
    if (groupedDevices[owner]) {
      groupedDevices[owner].push(d);
    } else {
      groupedDevices["未登録"].push(d);
    }
  });

  const renderGroup = (title: string, groupDevices: Device[]) => {
    if (groupDevices.length === 0) return null;
    return (
      <div key={title} className="mb-8">
        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4 px-2">
          <div className="w-2 h-6 bg-pink-300 rounded-full" />
          {title}のデバイス
        </h2>
        <div className="space-y-4">
          {groupDevices.map((device) => {
            const colorTheme = COLOR_MAP[device.color || "pink"] || COLOR_MAP.pink;
            return (
              <div
                key={device.id}
                className={`relative overflow-hidden p-4 rounded-3xl transition-all duration-300 bg-white shadow-sm border border-pink-100 ${
                  device.is_online ? "shadow-pink-200/50" : "opacity-60 grayscale-[20%]"
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        device.is_online
                          ? (!device.name || device.name === "Unknown")
                            ? "bg-slate-200 text-slate-500"
                            : `${colorTheme.bg} ${colorTheme.text}`
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-slate-700 ${(!device.name || device.name === "Unknown") ? "italic text-slate-400" : ""}`}>
                        {device.name || "Unknown"}
                      </h3>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {device.is_online ? "おうちにいます" : "おでかけ中"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          MAC: {device.id} {device.ip ? `| IP: ${device.ip}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {device.is_online ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                        <HomeIcon className="w-3 h-3" />
                        Home
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                        <WifiOff className="w-3 h-3" />
                        Away
                      </div>
                    )}
                    <button
                      onClick={() => openEditModal(device)}
                      className="text-slate-300 hover:text-pink-400 transition-colors p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const onlineCount = devices.filter(d => d.is_online).length;

  return (
    <main className="min-h-screen bg-[#FFF5F7] text-slate-800 p-6 pb-24 font-sans selection:bg-pink-200">
      <div className="max-w-md mx-auto">
        <header className="flex flex-col gap-4 mb-8 mt-4 bg-white p-4 rounded-3xl shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-700 tracking-tight">
                  Kazoku Radar
                </h1>
                <p className="text-[10px] font-bold text-pink-400">HOME WI-FI TRACKER</p>
              </div>
            </div>
            <button
              onClick={requestScan}
              className="flex items-center gap-2 px-4 py-2 bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all active:scale-95 text-white text-sm font-bold shadow-md shadow-pink-200"
            >
              <Scan className="w-4 h-4" />
              さがす
            </button>
          </div>
          
          <div className="flex flex-col gap-2 pt-3 border-t border-pink-50">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-emerald-500"/> 現在つながっているデバイス:</span>
              <span className="text-pink-500 text-sm">{onlineCount} 台</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> 最終スキャン:</span>
              <span>{lastScan ? lastScan.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "取得中..."}</span>
            </div>
          </div>
        </header>

        <div className="space-y-2">
          {devices.length === 0 && (
            <div className="p-8 text-center bg-white rounded-3xl border border-pink-100 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">デバイスがありません。<br/>「さがす」ボタンを押してね🌸</p>
            </div>
          )}
          
          {/* Render in specific order */}
          {["ちさこ", "父", "母", "とし", "TV", "PC", "未登録"].map((owner) => 
            renderGroup(owner, groupedDevices[owner])
          )}
        </div>

        {editingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-2xl scale-in-center">
              <h3 className="text-xl font-black text-slate-700 mb-6 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-pink-400" />
                デバイスの編集
              </h3>
              <form onSubmit={updateDeviceName} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">なまえ</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="例: パパのiPhone"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">だれの？</label>
                  <div className="flex flex-wrap gap-2">
                    {[...OWNERS, "未登録"].map((owner) => (
                      <button
                        key={owner}
                        type="button"
                        onClick={() => setNewOwner(owner === "未登録" ? "" : owner)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          (newOwner === owner) || (newOwner === "" && owner === "未登録")
                            ? "bg-slate-700 text-white shadow-md"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {owner}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-3">アイコンのいろ</label>
                  <div className="flex gap-3 justify-between px-2">
                    {Object.keys(COLOR_MAP).map((colorKey) => {
                      const c = COLOR_MAP[colorKey];
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setNewColor(colorKey)}
                          className={`w-10 h-10 rounded-2xl ${c.bg} transition-all ${
                            newColor === colorKey ? `ring-4 ring-offset-2 ${c.ring} scale-110 shadow-sm` : "opacity-50 hover:opacity-100"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingDevice(null)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-colors"
                  >
                    やめる
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-pink-400 hover:bg-pink-500 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-pink-200"
                  >
                    ほぞんする
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
