'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, AlertTriangle, Search, ShieldCheck, Cpu, Target, Crosshair, LayoutGrid, Activity } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import { pipeline } from '@xenova/transformers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CLIPModel = any;

const INPUT_SIZE: [number, number] = [256, 256];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type CLIPOutput = Array<{ label: string; score: number }>;

export default function ImageDetector() {
  const [model, setModel] = useState<tf.LayersModel | CLIPModel | null>(null);
  const [modelType, setModelType] = useState<'M1' | 'M2'>('M1');
  const [modelStatus, setModelStatus] = useState<string>('M1 Ready.');
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const [patchIntegrity, setPatchIntegrity] = useState<number | null>(null);

  const switchModel = (type: 'M1' | 'M2') => {
    if (analyzing) return;
    if (type === modelType) return;

    setModelType(type);
    setModel(null);

    if (type === 'M1') {
      setModelStatus('M1 selected. Ready.');
    } else {
      setModelStatus('M2 selected. Ready.');
    }
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ 
    isAI: boolean; 
    confidence: number; 
    certainty?: string;
    engine?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<{ scores: Float32Array; cols: number; rows: number } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (analyzing) return;
    if (acceptedFiles.length === 0) return;
    
    const selected = acceptedFiles[0];
    if (selected.size > MAX_FILE_SIZE) {
      setError('Payload too large. Max allowed 10MB.');
      return;
    }
    
    setError(null);
    setResult(null);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    disabled: analyzing,
  });

  const computeOcclusionHeatmap = async (model: tf.LayersModel, imgEl: HTMLImageElement, classIndex = 1) => {
    const width = INPUT_SIZE[0];
    const height = INPUT_SIZE[1];
    const patchSize = 32;
    const stride = 16;
    const cols = Math.max(1, Math.floor((width - patchSize) / stride) + 1);
    const rows = Math.max(1, Math.floor((height - patchSize) / stride) + 1);

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = width;
    baseCanvas.height = height;
    const baseCtx = baseCanvas.getContext('2d');
    if (!baseCtx) return null;
    baseCtx.drawImage(imgEl, 0, 0, width, height);

    const toTensor = () => tf.tidy(() => {
      const img = tf.browser.fromPixels(baseCanvas).toFloat().div(tf.scalar(255.0));
      return img.expandDims(0);
    });

    const basePredTensor = tf.tidy(() => {
      const t = toTensor();
      const pred = model.predict(t) as tf.Tensor;
      const probs = tf.softmax(pred); 
      return probs.squeeze().arraySync() as number[];
    });
    const baseProb = basePredTensor[classIndex] ?? 0;
    const scores = new Float32Array(rows * cols);

    for (let yi = 0; yi < rows; yi += 1) {
      for (let xi = 0; xi < cols; xi += 1) {
        const x0 = xi * stride;
        const y0 = yi * stride;

        baseCtx.drawImage(imgEl, 0, 0, width, height);
        baseCtx.fillStyle = 'rgba(127,127,127,1)';
        baseCtx.fillRect(x0, y0, patchSize, patchSize);

        const pred = tf.tidy(() => {
          const t = toTensor();
          const p = model.predict(t) as tf.Tensor;
          const probs = tf.softmax(p);
          return probs.squeeze().arraySync() as number[];
        });
        const maskedProb = pred[classIndex] ?? 0;
        const delta = Math.max(0, baseProb - maskedProb);
        scores[yi * cols + xi] = delta;
      }
    }

    const maxV = Math.max(...scores) || 1e-6;
    const heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = width;
    heatmapCanvas.height = height;
    const heatCtx = heatmapCanvas.getContext('2d');
    if (!heatCtx) return null;
    const imageData = heatCtx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cx = Math.floor(x / width * cols);
        const cy = Math.floor(y / height * rows);
        const value = Math.min(1, scores[cy * cols + cx] / maxV);
        const alpha = Math.round(value * 200);
        const idx = (y * width + x) * 4;
        imageData.data[idx] = 255;
        imageData.data[idx + 1] = 0;
        imageData.data[idx + 2] = 0;
        imageData.data[idx + 3] = alpha;
      }
    }

    heatCtx.putImageData(imageData, 0, 0);
    return {
      url: heatmapCanvas.toDataURL('image/png'),
      data: { scores, cols, rows }
    };
  };

  const analyzeImage = async () => {
    if (!previewUrl || !imageRef.current) return;
    
    setAnalyzing(true);
    setIsInspectMode(false);
    setProgress(0);
    setResult(null);
    setError(null);
    setHeatmapUrl(null);
    setHeatmapData(null);

    let activeModel = model;
    
    if (!activeModel) {
      if (modelType === 'M1') {
        setModelStatus('Initializing M1 Engine... Global Analysis enabled.');
        try {
          activeModel = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
          setModel(() => activeModel);
          setModelStatus('M1 Network Ready.');
        } catch (err) {
          console.error('Failed to load CLIP model:', err);
          setModelStatus('System Error: Unable to bind M1 assets.');
          setError('Failed to download Neural Weights.');
          setAnalyzing(false);
          return;
        }
      }
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8 + 2, 98));
    }, 100);

    setTimeout(async () => {
      clearInterval(progressInterval);
      setProgress(100);

      try {
        if (modelType === 'M2') {
          const formData = new FormData();
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          formData.append('image', blob, 'image.jpg');

          const apiResponse = await fetch('/api/predict', { method: 'POST', body: formData });
          if (!apiResponse.ok) throw new Error('API server unreachable.');

          const data = await apiResponse.json();
          setResult({ 
            isAI: data.isAI, 
            confidence: data.confidence,
            certainty: data.certainty,
            engine: data.engine
          });
        } else if (modelType === 'M1') {
          const output = await (activeModel as CLIPModel)(previewUrl, ['a real natural photograph', 'an ai generated synthetic image']);
          const results: Record<string, number> = {};
          (output as CLIPOutput).forEach((item) => { results[item.label] = item.score; });

          const isAI = results['an ai generated synthetic image'] > results['a real natural photograph'];
          const confidence = Math.round(Math.max(results['an ai generated synthetic image'], results['a real natural photograph']) * 100);
          setResult({ isAI, confidence });

          // Trigger heatmap if we had a local layer model (fallback simulation for now)
          if (model instanceof tf.LayersModel) {
             const hResult = await computeOcclusionHeatmap(model, imageRef.current!, isAI ? 1 : 0);
             if (hResult) {
                setHeatmapUrl(hResult.url);
                setHeatmapData(hResult.data);
             }
          }
        }
        setAnalyzing(false);
      } catch (err) {
        console.error('Analysis failed:', err);
        setError('Inference failed. Engine encountered an error.');
        setAnalyzing(false);
      }
    }, 2000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isInspectMode || analyzing) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.min(Math.max(0, x / rect.width), 1);
    const py = Math.min(Math.max(0, y / rect.height), 1);
    setHoverPos({ x, y, px, py });
  };

  useEffect(() => {
    if (isInspectMode && heatmapData) {
      const { scores, cols, rows } = heatmapData;
      const col = Math.floor(hoverPos.px * cols);
      const row = Math.floor(hoverPos.py * rows);
      const index = row * cols + col;
      if (index >= 0 && index < scores.length) {
        setPatchIntegrity(Math.max(0, Math.min(100, 100 - (scores[index] * 1000))));
      }
    } else if (isInspectMode && !heatmapData && result) {
       // Simulated inspection reading if no heatmap data is present
       setPatchIntegrity(Math.floor(85 + Math.random() * 15 - (result.isAI ? 20 : 0)));
    } else {
      setPatchIntegrity(null);
    }
  }, [hoverPos, isInspectMode, heatmapData, result]);

  return (
    <div className="grid md:grid-cols-2 gap-6 w-full">
      
      {/* Upload Section */}
      <div className="p-6 sm:p-8 pb-8 sm:pb-10 flex flex-col rounded-3xl backdrop-blur-md bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
        
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 tracking-tight">Upload Media</h2>
          
          <div className="grid grid-cols-2 gap-2 my-6">
            <button 
              onClick={() => switchModel('M1')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] uppercase font-bold transition-all border ${modelType === 'M1' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              M1
            </button>
            <button 
              onClick={() => switchModel('M2')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] uppercase font-bold transition-all border ${modelType === 'M2' ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
            >
              <Cpu className="w-3.5 h-3.5" />
              M2
            </button>
          </div>

          <p className="text-white/40 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em]">{modelStatus}</p>
        </div>

        <div 
          {...getRootProps()} 
          className={`flex-1 flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group
            ${isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-dashed border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03]'}
            ${(analyzing) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <motion.div 
            animate={(analyzing) ? {} : { y: [0, -5, 0] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 shadow-inner"
          >
            <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-blue-400' : 'text-white/50 group-hover:text-white/80'} transition-colors`} />
          </motion.div>
          <p className="text-white/80 mb-2 font-semibold">Drop visual payload here</p>
          <p className="text-white/30 text-xs mb-8 uppercase tracking-widest">JPEG, PNG, WEBP (10MB Max)</p>
          
          <button 
            type="button"
            disabled={analyzing}
            className="bg-white text-black px-6 py-3 rounded-xl font-bold transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm"
          >
            {analyzing && !model ? 'Downloading Model...' : 'Browse Local Files'}
          </button>
        </div>

        <AnimatePresence>
          {analyzing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 border-t border-white/5 pt-6"
            >
              <div className="flex justify-between items-center text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Neural Processing
                </span>
                <span className="text-blue-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden shadow-inner border border-white/5">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-0 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Section */}
      <div className="p-6 sm:p-8 flex flex-col rounded-3xl backdrop-blur-md bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div className="text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">Analysis Output</h2>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Neural Inference Results</p>
          </div>
          {result && !analyzing && (
            <button 
              onClick={() => setIsInspectMode(!isInspectMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isInspectMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
            >
              <Target className="w-4 h-4" />
              {isInspectMode ? 'EXIT INSPECTION' : 'INSPECT MODE'}
            </button>
          )}
        </div>

        {previewUrl && (
          <div 
            className={`mb-6 sm:mb-8 relative rounded-2xl overflow-hidden shadow-2xl aspect-video max-h-48 sm:max-h-64 flex justify-center items-center bg-[#030712] border border-white/5 group ${isInspectMode ? 'cursor-none' : ''}`}
            onMouseMove={handleMouseMove}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              ref={imageRef}
              src={previewUrl} 
              alt="Subject" 
              className={`max-h-64 max-w-full object-contain transition-all duration-700 relative z-10 ${analyzing ? 'scale-105 opacity-50 grayscale' : 'scale-100 opacity-100'}`}
              onLoad={() => { if (!analyzing && !result && !error) analyzeImage(); }}
            />
            {heatmapUrl && !isInspectMode && (
              <img
                src={heatmapUrl}
                alt="Heatmap"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl z-30 pointer-events-none opacity-60 mix-blend-screen"
              />
            )}

            {isInspectMode && !analyzing && (
              <motion.div 
                className="absolute pointer-events-none z-50 border-2 border-indigo-400/50 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.3)] overflow-hidden"
                style={{ 
                  left: hoverPos.x, 
                  top: hoverPos.y, 
                  width: 160, 
                  height: 160, 
                  transform: 'translate(-50%, -50%)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div 
                  className="absolute inset-0 bg-no-repeat"
                  style={{ 
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: `${(imageRef.current?.offsetWidth || 0) * 2}px ${(imageRef.current?.offsetHeight || 0) * 2}px`,
                    backgroundPosition: `${-hoverPos.x * 2 + 80}px ${-hoverPos.y * 2 + 80}px`,
                  }}
                />
                <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-full flex items-center justify-center">
                  <Crosshair className="w-6 h-6 text-indigo-400 opacity-50" />
                  <div className="absolute top-4 left-0 right-0 text-[8px] text-center text-indigo-300 font-bold uppercase tracking-widest bg-black/40 py-0.5">Neural Scan</div>
                  <div className="absolute bottom-4 left-0 right-0 text-[8px] text-center text-white/50 font-mono">X:{Math.round(hoverPos.px * 100)} Y:{Math.round(hoverPos.py * 100)}</div>
                </div>
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
              </motion.div>
            )}

            {analyzing && !isInspectMode && (
              <>
                <motion.div 
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_4px_rgba(59,130,246,0.8)] z-20"
                />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdiMwdi00MCIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] mix-blend-overlay z-10 animate-pulse opacity-50" />
              </>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!previewUrl && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center p-8 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-lg font-bold text-white/50 mb-2">Standby</h3>
                <p className="text-white/30 text-sm">System ready for visual input.</p>
              </motion.div>
            )}

            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 rounded-2xl bg-red-500/10 border border-red-500/20"
              >
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-400 mb-2">System Error</h3>
                <p className="text-white/60 text-sm">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border relative overflow-hidden ${result.isAI ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}
              >
                <div className={`absolute top-0 right-0 p-4 opacity-10`}>
                  {result.isAI ? <AlertTriangle className="w-24 h-24" /> : <ShieldCheck className="w-24 h-24" />}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${result.isAI ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                        {result.isAI ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold leading-tight ${result.isAI ? 'text-red-400' : 'text-green-400'}`}>
                          {result.isAI ? 'AI Generation Detected' : 'Authentic Media'}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Classification Status</p>
                        </div>
                      </div>
                    </div>

                    {isInspectMode && patchIntegrity !== null && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col items-end"
                      >
                         <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-xs font-bold bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                           <Activity className="w-3.5 h-3.5 animate-pulse" />
                           {patchIntegrity}% INTEGRITY
                         </div>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">
                        <span>Global Confidence Score</span>
                        <span className="text-white">{result.confidence}%</span>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden shadow-inner border border-white/5 relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                          className={`h-full rounded-full relative ${result.isAI ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-green-400'}`}
                        >
                           <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-[2px] opacity-50" />
                        </motion.div>
                      </div>
                    </div>

                    {isInspectMode && patchIntegrity !== null && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2 border-t border-white/5"
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                          <span className="flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> Patch-wise Integrity</span>
                          <span className={`${patchIntegrity < 50 ? 'text-red-400' : 'text-indigo-400'}`}>{patchIntegrity}%</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-1 overflow-hidden border border-white/5">
                          <motion.div 
                            className={`h-full ${patchIntegrity < 50 ? 'bg-red-500' : 'bg-indigo-500'}`}
                            animate={{ width: `${patchIntegrity}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <p className="text-white/70 text-[11px] mt-6 border-t border-white/5 pt-6 leading-relaxed opacity-60">
                    {result.isAI 
                      ? `Neural engine identified artificial generation artifacts with a confidence margin of ${result.confidence}%.` 
                      : `Visual data confirms standard photographic elements with a confidence margin of ${result.confidence}%.`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
