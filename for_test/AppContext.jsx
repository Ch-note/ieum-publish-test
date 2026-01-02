// src/context/AppContext.jsx
import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // --- 기존 상태들 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // --- [추가] 우리가 만든 데이터 저장소 ---
  const [transcript, setTranscript] = useState(""); // 녹음된 텍스트
  const [aiSummary, setAiSummary] = useState(""); // GPT 요약본

  const startMeeting = (meetingData) => {
    setCurrentMeeting(meetingData);
    setIsRecording(true);
    setRecordingTime(0);
    // [선택] 새 회의 시작할 때 이전 기록 초기화하면 좋음
    setTranscript("");
    setAiSummary("");
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const addMeeting = (meeting) => {
    setMeetings([meeting, ...meetings]);
  };

  // --- [중요] value 보따리에 추가한 변수들도 꼭 넣어줘야 함! ---
  const value = {
    isLoggedIn,
    setIsLoggedIn,
    currentMeeting,
    setCurrentMeeting,
    meetings,
    setMeetings,
    isRecording,
    setIsRecording,
    recordingTime,
    setRecordingTime,
    startMeeting,
    stopRecording,
    addMeeting,
    // ▼▼▼ 여기 추가됨 ▼▼▼
    transcript,
    setTranscript,
    aiSummary,
    setAiSummary,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
