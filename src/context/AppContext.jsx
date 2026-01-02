import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import axios from 'axios';

const AppContext = createContext()
const WHISPER_BACKEND_URL = import.meta.env.VITE_WHISPER_BACKEND_URL || "https://ieum-stt.livelymushroom-0e97085f.australiaeast.azurecontainerapps.io";
const WHISPER_WS_URL = import.meta.env.VITE_WHISPER_WS_URL || "wss://ieum-stt.livelymushroom-0e97085f.australiaeast.azurecontainerapps.io/ws";

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentMeeting, setCurrentMeeting] = useState(null)
  const [meetings, setMeetings] = useState([])

  // 회의 상태 전역 관리
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [flowState, setFlowState] = useState("idle") // 'idle' | 'recording' | 'saving' | 'completed'
  const [backendStatus, setBackendStatus] = useState("disconnected")
  const [transcript, setTranscript] = useState("")
  const [aiSummary, setAiSummary] = useState("")
  const [aiMessages, setAiMessages] = useState([
    { type: "ai", text: "회의 중 궁금한 점이 있으면 물어보세요!", time: "14:35" },
  ]);

  // 로직용 Ref
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const chunkTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // 1. 백엔드 예열 & 소켓 연결 (로그인 시 또는 앱 시작 시)
  useEffect(() => {
    let reconnectTimer;
    const warmupAndConnect = async () => {
      try {
        setBackendStatus("loading");
        await axios.get(`${WHISPER_BACKEND_URL}/status`, { timeout: 10000 });
        connectSocket();
      } catch (e) {
        console.log("📡 Backend startup check failed, retrying socket...");
        connectSocket();
      }
    };

    const connectSocket = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;
      const socket = new WebSocket(WHISPER_WS_URL);
      socket.onopen = () => setBackendStatus("connected");
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "status") setBackendStatus(data.value);
      };
      socket.onclose = () => {
        setBackendStatus("disconnected");
        reconnectTimer = setTimeout(connectSocket, 5000);
      };
      socketRef.current = socket;
    };

    warmupAndConnect();
    return () => {
      clearTimeout(reconnectTimer);
      // 앱 종료 시 소켓 닫음 (컴포넌트 unmount 시 아님)
    };
  }, []);

  // 2. 타이머 로직
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording, isPaused]);

  // 3. 청크 업로드 로직
  const uploadChunk = async (blob) => {
    const currentIndex = chunkIndexRef.current;
    chunkIndexRef.current += 1;
    const formData = new FormData();
    formData.append("chunkIndex", currentIndex);
    formData.append("file", blob, `chunk_${currentIndex}.webm`);
    try {
      await axios.post(`${WHISPER_BACKEND_URL}/chunk`, formData);
    } catch (e) { console.error("Chunk upload fail", e); }
  };

  // 4. 액션 핸들러
  const handleStartRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) uploadChunk(e.data); };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setFlowState("recording");
      setRecordingTime(0);
      chunkTimerRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === "recording" && !isPaused) {
          mediaRecorderRef.current.requestData();
        }
      }, 30000);
    }).catch(err => {
      alert("마이크 권한이 필요합니다.");
      setFlowState("idle");
    });
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) mediaRecorderRef.current.resume();
    else mediaRecorderRef.current.pause();
    setIsPaused(!isPaused);
  };

  const handleStopRecordingFlow = async () => {
    setIsRecording(false);
    setFlowState("saving");
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
    clearInterval(chunkTimerRef.current);
    try {
      const resp = await axios.post(`${WHISPER_BACKEND_URL}/end`);
      setTranscript(`회의 저장 완료 (세그먼트: ${resp.data.segments || 0})`);
      setFlowState("completed");
    } catch (e) { setFlowState("completed"); }
  };

  const handleResetMeeting = async () => {
    try {
      await axios.post(`${WHISPER_BACKEND_URL}/reset`);
      setFlowState("idle");
      setRecordingTime(0);
      setTranscript("");
    } catch (e) { setFlowState("idle"); }
  };

  const startMeeting = (meetingData) => {
    setCurrentMeeting(meetingData);
    setFlowState("idle");
    setRecordingTime(0);
    setTranscript("");
    setAiSummary("");
  };

  const value = {
    isLoggedIn, setIsLoggedIn,
    currentMeeting, setCurrentMeeting,
    meetings, setMeetings,
    isRecording, setIsRecording,
    isPaused, setIsPaused,
    recordingTime, setRecordingTime,
    flowState, setFlowState,
    backendStatus, setBackendStatus,
    transcript, setTranscript,
    aiSummary, setAiSummary,
    aiMessages, setAiMessages,
    handleStartRecording,
    handlePauseResume,
    handleStopRecordingFlow,
    handleResetMeeting,
    startMeeting,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
