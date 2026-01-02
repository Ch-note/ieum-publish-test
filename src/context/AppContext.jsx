import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext()

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
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const [transcript, setTranscript] = useState("")
  const [aiSummary, setAiSummary] = useState("")

  const startMeeting = (meetingData) => {
    setCurrentMeeting(meetingData)
    setIsRecording(false) // 사용자가 직접 시작하도록 수정
    setRecordingTime(0)
    setTranscript("") // 초기화
    setAiSummary("")
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const addMeeting = (meeting) => {
    setMeetings([meeting, ...meetings])
  }

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
    transcript, // 추가
    setTranscript, // 추가
    aiSummary, // 추가
    setAiSummary, // 추가
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
