'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { Navbar } from '@/components/landing';
import {
  UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2,
  ShieldCheck, GraduationCap, Camera, QrCode, Search, X,
  ArrowRight, ScanLine, FileSearch, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentVerificationInline from '@/components/DocumentVerificationInline';

type VerifyMethod = 'qr' | 'document' | 'id' | null;

export default function VerifyPage() {
  const router = useRouter();
  const [activeMethod, setActiveMethod] = useState<VerifyMethod>(null);

  // QR state
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [marksheets, setMarksheets] = useState<any[]>([]);
  const [scanLog, setScanLog] = useState<any>(null);
  const [scanMode, setScanMode] = useState<'upload' | 'camera'>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // ID Lookup state
  const [certId, setCertId] = useState('');
  const [prn, setPrn] = useState('');
  const [idLoading, setIdLoading] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  // Document OCR state
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { return () => stopCamera(); }, []);

  const stopCamera = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setQrError(null); setQrLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true); setQrLoading(false); scanFrame();
      }
    } catch {
      setQrError('Camera access denied. Use upload instead.'); setQrLoading(false); setScanMode('upload');
    }
  };

  const handleModeSwitch = (mode: 'upload' | 'camera') => {
    if (mode === 'upload') stopCamera(); else startCamera();
    setScanMode(mode); setQrError(null);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current, video = videoRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code) { stopCamera(); handleScannedData(code.data); return; }
      }
    }
    animationRef.current = requestAnimationFrame(scanFrame);
  };

  const processQrImageUpload = (file: File) => {
    setQrLoading(true); setQrError(null); setQrSuccess(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setQrError('Failed to process image'); setQrLoading(false); return; }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) handleScannedData(code.data);
        else { setQrError('No QR code found in image. Try a clearer photo.'); setQrLoading(false); }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleScannedData = async (data: string) => {
    setQrLoading(true); setQrError(null);
    if (!data.startsWith('AUTHBLOCK_SECURE_QR:')) {
      setQrError('Invalid QR format. Only AuthBlock QR codes are supported.'); setQrLoading(false); return;
    }
    const token = data.split(':')[1];
    try {
      const res = await fetch('/api/qr/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qr_token: token }) });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Verification failed');
      setStudentData(resData.user); setMarksheets(resData.marksheets); setScanLog(resData.logs); setQrSuccess(true);
    } catch (err: any) {
      setQrError(err.message || 'Verification error');
    } finally { setQrLoading(false); }
  };

  const handleIdLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim() && !prn.trim()) { setIdError('Enter a Certificate ID or PRN number'); return; }
    setIdLoading(true); setIdError(null);
    const params = new URLSearchParams();
    if (certId.trim()) params.set('cert', certId.trim());
    if (prn.trim()) params.set('prn', prn.trim());
    router.push(`/verify?${params.toString()}`);
  };

  const handleDocumentUpload = (file: File) => {
    setDocLoading(true); setDocError(null);
    // Redirect to the OCR verify page with the file
    router.push('/verify');
  };

  const methodCards = [
    {
      id: 'qr' as VerifyMethod,
      icon: QrCode,
      title: 'Scan QR Code',
      description: 'Upload or scan the secure QR code printed on an AuthBlock-issued certificate',
      color: 'blue',
      badge: 'Instant',
    },
    {
      id: 'document' as VerifyMethod,
      icon: FileSearch,
      title: 'Upload Document',
      description: 'Upload a marksheet or degree PDF — we extract and verify the data against the blockchain via OCR',
      color: 'emerald',
      badge: 'OCR Powered',
    },
  ];

  const colorMap: any = {
    blue:    { border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700',   ring: 'ring-blue-400' },
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'ring-emerald-400' },
    amber:   { border: 'border-amber-200',   bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700',   btn: 'bg-amber-600 hover:bg-amber-700',   ring: 'ring-amber-400' },
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 pt-28">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-bold text-xs uppercase tracking-widest mb-5">
            <ShieldCheck className="w-3.5 h-3.5" /> AuthBlock Verification Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Verify a Document
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Three ways to instantly verify the authenticity of any AuthBlock-issued academic credential — all backed by the Ethereum blockchain.
          </p>
        </motion.div>

        {/* Method Cards */}
        {!activeMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 max-w-2xl mx-auto"
          >
            {methodCards.map((card, i) => {
              const c = colorMap[card.color];
              return (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => {
                    if (card.id === 'document') setActiveMethod('document');
                    else setActiveMethod(card.id);
                  }}
                  className={`group text-left bg-white rounded-2xl border ${c.border} p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ring-0 hover:ring-2 ${c.ring} ring-offset-2`}
                >
                  <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${c.badge}`}>
                    {card.badge}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{card.description}</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${c.text}`}>
                    Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* How it Works info strip */}
        {!activeMethod && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400 font-medium mb-4">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Tamper-proof verification</span>
            <span className="hidden sm:block text-slate-200">·</span>
            <span className="flex items-center gap-1.5"><ScanLine className="w-3.5 h-3.5 text-blue-500" /> Ethereum-anchored hashes</span>
            <span className="hidden sm:block text-slate-200">·</span>
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-500" /> No login required</span>
          </div>
        )}

        {/* ── QR SCAN PANEL ─────────────────────────────── */}
        <AnimatePresence>
          {activeMethod === 'qr' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><QrCode className="w-6 h-6 text-blue-600" /> QR Code Verification</h2>
                  <p className="text-slate-500 text-sm mt-1">Upload an image of the QR code or use your camera to scan it live</p>
                </div>
                <button onClick={() => { stopCamera(); setActiveMethod(null); setQrSuccess(false); setQrError(null); }}
                  className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" /> Change Method
                </button>
              </div>

              {!qrSuccess ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-xl mx-auto">
                  {/* Mode Toggle */}
                  <div className="flex p-1 bg-slate-100 rounded-xl mb-7">
                    {(['upload', 'camera'] as const).map(mode => (
                      <button key={mode} onClick={() => handleModeSwitch(mode)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${scanMode === mode ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                        {mode === 'upload' ? <><UploadCloud className="w-4 h-4" /> Upload Image</> : <><Camera className="w-4 h-4" /> Live Camera</>}
                      </button>
                    ))}
                  </div>

                  {scanMode === 'upload' ? (
                    <div
                      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${qrError ? 'border-red-300 bg-red-50' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 bg-slate-50'}`}
                      onClick={() => !qrLoading && fileInputRef.current?.click()}>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
                        onChange={e => { if (e.target.files?.[0]) processQrImageUpload(e.target.files[0]); }} />
                      {qrLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                          <p className="text-sm font-bold text-slate-600">Verifying on Blockchain…</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className={`p-4 rounded-full ${qrError ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'}`}>
                            <UploadCloud className="w-8 h-8" />
                          </div>
                          <p className="text-lg font-bold text-slate-800">Upload QR Code Image</p>
                          <p className="text-sm text-slate-500">Tap to select from your device</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center relative">
                      {qrLoading && !isCameraActive && (
                        <div className="absolute inset-0 bg-slate-50/80 rounded-2xl flex flex-col justify-center items-center z-10">
                          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                          <span className="text-sm font-medium text-slate-600">Starting Camera…</span>
                        </div>
                      )}
                      <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto shadow-md">
                        <video ref={videoRef} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                          <div className="w-full h-full border-2 border-green-400/80 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white -mt-1 -ml-1" />
                            <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white -mt-1 -mr-1" />
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white -mb-1 -ml-1" />
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white -mb-1 -mr-1" />
                          </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <p className="text-sm text-slate-500 mt-3">Point your camera at the AuthBlock QR code</p>
                    </div>
                  )}

                  {qrError && (
                    <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-700">{qrError}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* QR SUCCESS */
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-slate-900">Verification Successful</h2>
                        <p className="text-emerald-700 font-medium text-sm">Identity verified against Ethereum blockchain</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-5 border border-slate-100 mb-5">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                        <p className="text-xl font-bold text-slate-900">{studentData?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PRN Number</p>
                        <p className="text-xl font-bold text-slate-900 font-mono">{studentData?.prn_no}</p>
                      </div>
                    </div>
                    {scanLog && (
                      <div className="bg-slate-900 text-slate-300 p-5 rounded-xl text-xs font-mono space-y-2">
                        <p><span className="text-slate-500">Timestamp:</span> {new Date(scanLog.timestamp).toLocaleString()}</p>
                        <p><span className="text-slate-500">TX Hash:</span> <a href={`https://sepolia.etherscan.io/tx/${scanLog.tx_hash}`} target="_blank" className="text-emerald-400 hover:underline break-all">{scanLog.tx_hash}</a></p>
                        <p className="text-emerald-400 font-bold border-t border-slate-800 pt-2">✓ Scan event permanently recorded on Ethereum.</p>
                      </div>
                    )}
                  </div>

                  {marksheets.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" /> Academic Records
                      </h3>
                      <div className="space-y-3">
                        {marksheets.map((doc: any) => (
                          <div key={doc.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{doc.branch}</span>
                                <span className="text-xs text-slate-500 font-medium">{doc.session_name}</span>
                              </div>
                              <h4 className="font-bold text-slate-900">{doc.examination}</h4>
                            </div>
                            <div className="flex items-center gap-3 mt-3 md:mt-0">
                              <div className="text-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400">SGPI</p>
                                <p className="text-lg font-black text-slate-800">{doc.sgpi}</p>
                              </div>
                              <span className={`text-sm font-black ${doc.remarks?.toUpperCase().includes('PASS') || doc.remarks === 'SUCCESSFUL' ? 'text-emerald-600' : 'text-red-500'}`}>{doc.remarks}</span>
                              {doc.supabase_pdf_url && (
                                <a href={doc.supabase_pdf_url} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors">
                                  <FileText className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <button onClick={() => { setQrSuccess(false); setActiveMethod(null); }} className="text-slate-500 hover:text-slate-900 font-bold text-sm underline transition-colors">
                      Verify Another Document
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ID LOOKUP PANEL ─────────────────────────── */}
          {activeMethod === 'id' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Hash className="w-6 h-6 text-amber-600" /> Certificate ID Lookup</h2>
                  <p className="text-slate-500 text-sm mt-1">Enter a Certificate ID or PRN number to fetch and verify credentials</p>
                </div>
                <button onClick={() => { setActiveMethod(null); setIdError(null); setCertId(''); setPrn(''); }}
                  className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" /> Change Method
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-xl mx-auto">
                <form onSubmit={handleIdLookup} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Certificate ID</label>
                    <input
                      type="text"
                      value={certId}
                      onChange={e => setCertId(e.target.value)}
                      placeholder="e.g. cert-uuid-here"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-slate-50 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-bold text-slate-400 uppercase">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Student PRN Number</label>
                    <input
                      type="text"
                      value={prn}
                      onChange={e => setPrn(e.target.value)}
                      placeholder="e.g. 20230164000000"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-slate-50 placeholder-slate-400"
                    />
                  </div>

                  {idError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700 font-medium">{idError}</p>
                    </div>
                  )}

                  <button type="submit" disabled={idLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60">
                    {idLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {idLoading ? 'Looking up…' : 'Verify Credential'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
          {/* ── DOCUMENT UPLOAD PANEL ───────────────────── */}
          {activeMethod === 'document' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileSearch className="w-6 h-6 text-emerald-600" /> Upload Document to Verify
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Upload a PDF or scanned image — we extract and match the hash against the blockchain via OCR</p>
                </div>
                <button onClick={() => setActiveMethod(null)}
                  className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" /> Change Method
                </button>
              </div>
              <DocumentVerificationInline />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
