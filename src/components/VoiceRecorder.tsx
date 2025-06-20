import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Send, Trash2, Square } from 'lucide-react';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVoice: (audioBlob: Blob, duration: number) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ isOpen, onClose, onSendVoice }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // تنظيف الموارد عند الإغلاق
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // تحديث مستوى الصوت أثناء التسجيل
  const updateVolume = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
      setVolume(average / 255);
      
      if (isRecording && !isPaused) {
        animationRef.current = requestAnimationFrame(updateVolume);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // إعداد محلل الصوت
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setDuration(recordingTime);
        
        // إيقاف جميع المسارات
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // تسجيل كل 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // بدء العداد
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // بدء تحديث مستوى الصوت
      updateVolume();

    } catch (error) {
      console.error('خطأ في بدء التسجيل:', error);
      alert('لا يمكن الوصول إلى الميكروفون. تأكد من منح الإذن.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        
        // استئناف العداد
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        updateVolume();
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        
        // إيقاف العداد
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      setVolume(0);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        
        // تحديث وقت التشغيل
        const updatePlaybackTime = () => {
          if (audioRef.current) {
            setPlaybackTime(audioRef.current.currentTime);
            if (!audioRef.current.paused) {
              requestAnimationFrame(updatePlaybackTime);
            }
          }
        };
        updatePlaybackTime();
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setPlaybackTime(0);
    setDuration(0);
    setIsPlaying(false);
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSendVoice(audioBlob, duration);
      handleClose();
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    deleteRecording();
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeBarHeight = (index: number): number => {
    const baseHeight = 4;
    const maxHeight = 32;
    const volumeMultiplier = volume * 5; // تضخيم التأثير
    
    // إنشاء تأثير موجي
    const waveEffect = Math.sin((index * 0.5) + (Date.now() * 0.01)) * 0.3 + 0.7;
    
    return Math.max(baseHeight, Math.min(maxHeight, baseHeight + (volumeMultiplier * maxHeight * waveEffect)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* رأس النافذة */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Mic className="w-5 h-5" />
            رسالة صوتية
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Square className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="p-6">
          {/* مؤشر مستوى الصوت */}
          {isRecording && (
            <div className="flex items-center justify-center mb-6 h-16">
              <div className="flex items-end gap-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-green-500 rounded-full transition-all duration-100"
                    style={{
                      width: '3px',
                      height: `${getVolumeBarHeight(i)}px`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* مشغل الصوت */}
          {audioUrl && (
            <div className="mb-6">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => {
                  setIsPlaying(false);
                  setPlaybackTime(0);
                }}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setPlaybackTime(audioRef.current.currentTime);
                  }
                }}
              />
              
              {/* شريط التقدم */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-100"
                    style={{ 
                      width: duration > 0 ? `${(playbackTime / duration) * 100}%` : '0%' 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatTime(Math.floor(playbackTime))}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          )}

          {/* عداد الوقت */}
          <div className="text-center mb-6">
            <div className="text-3xl font-mono text-gray-800 mb-2">
              {formatTime(recordingTime)}
            </div>
            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                {isPaused ? 'متوقف مؤقتاً' : 'جاري التسجيل...'}
              </div>
            )}
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className="w-16 h-16 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center shadow-lg"
              >
                <Mic className="w-8 h-8" />
              </button>
            )}

            {isRecording && (
              <>
                <button
                  onClick={pauseRecording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                    isPaused 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  {isPaused ? <Mic className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 bg-gray-600 text-white rounded-full hover:bg-gray-700 flex items-center justify-center shadow-lg"
                >
                  <Square className="w-8 h-8" />
                </button>
              </>
            )}

            {audioBlob && (
              <>
                <button
                  onClick={playAudio}
                  className="w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center shadow-md"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={deleteRecording}
                  className="w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center shadow-md"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
                
                <button
                  onClick={sendVoiceMessage}
                  className="w-16 h-16 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center justify-center shadow-lg"
                >
                  <Send className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          {/* تعليمات */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {!isRecording && !audioBlob && (
              <p>اضغط على زر الميكروفون لبدء التسجيل</p>
            )}
            {isRecording && (
              <p>اضغط على زر الإيقاف لإنهاء التسجيل</p>
            )}
            {audioBlob && (
              <p>يمكنك الاستماع للتسجيل قبل الإرسال</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
