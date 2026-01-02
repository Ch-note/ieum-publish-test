import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Circle,
  Flex,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { FiMic, FiSquare, FiPause, FiPlay, FiSend } from "react-icons/fi";
import Card from "../components/Card";
import { useAppContext } from "../context/AppContext";
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
`;

const WHISPER_BACKEND_URL = import.meta.env.VITE_WHISPER_BACKEND_URL || "http://localhost:8000";
const WHISPER_WS_URL = import.meta.env.VITE_WHISPER_WS_URL || "ws://localhost:8000/ws";

function Meeting() {
  const navigate = useNavigate();
  const {
    currentMeeting,
    isRecording,
    setIsRecording, // 추가됨
    recordingTime,
    setRecordingTime,
    stopRecording,
    setTranscript, // Context에 저장하는 함수
  } = useAppContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [backendStatus, setBackendStatus] = useState("disconnected");

  // flowState: 'idle' | 'recording' | 'saving' | 'completed'
  const [flowState, setFlowState] = useState("idle");

  // ▼▼▼ [Real Tech] Whisper 백엔드 연결용 ▼▼▼
  // ... (omitting middle part as I will use the actual code)
  const [localTranscript, setLocalTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chunkIndexRef = useRef(0);
  const socketRef = useRef(null);
  const chunkTimerRef = useRef(null);

  const [aiMessages, setAiMessages] = useState([
    {
      type: "ai",
      text: "회의 중 궁금한 점이 있으면 물어보세요!",
      time: "14:35",
    },
  ]);
  const [aiInput, setAiInput] = useState("");

  // --- [1] 백엔드 예열 (Warm-up) 및 WebSocket 연결 ---
  useEffect(() => {
    let reconnectTimer;

    // ACA 컨테이너를 깨우기 위한 가벼운 HTTP 요청
    const warmupBackend = async () => {
      try {
        console.log("🔥 Warming up Whisper Backend...");
        setBackendStatus("loading");
        // /status 엔드포인트 (백엔드 main.py에 추가됨)
        await axios.get(`${WHISPER_BACKEND_URL}/status`, { timeout: 10000 });
      } catch (e) {
        console.log("📡 Backend is starting up or unreachable yet.");
      }
    };

    const connectSocket = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      console.log(`🔌 Attempting connection to: ${WHISPER_WS_URL}`);
      const socket = new WebSocket(WHISPER_WS_URL);

      socket.onopen = () => {
        console.log("✅ Whisper WebSocket Connected");
        setBackendStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "status") {
            setBackendStatus(data.value);
          }
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };

      socket.onclose = () => {
        console.log("🔌 Whisper WebSocket Disconnected. Retrying in 5s...");
        setBackendStatus("disconnected");
        reconnectTimer = setTimeout(connectSocket, 5000);
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        socket.close();
      };

      socketRef.current = socket;
    };

    warmupBackend().then(connectSocket);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, []);

  // --- [2] 오디오 청크를 서버로 전송하는 함수 ---
  const uploadChunk = async (blob) => {
    const currentIndex = chunkIndexRef.current;
    chunkIndexRef.current += 1;

    const formData = new FormData();
    formData.append("chunkIndex", currentIndex);
    formData.append("file", blob, `chunk_${currentIndex}.webm`);

    try {
      console.log(`📤 Sending chunk ${currentIndex}...`);
      const response = await axios.post(`${WHISPER_BACKEND_URL}/chunk`, formData);
      console.log(`✅ Chunk ${currentIndex} queued:`, response.data);
    } catch (error) {
      console.error(`❌ Error uploading chunk ${currentIndex}:`, error);
    }
  };

  // --- [3] 녹음 시작/중지 및 청킹 로직 ---
  useEffect(() => {
    if (!isRecording) {
      // 녹음 중지 시 처리
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
      }
      return;
    }

    // 녹음 시작
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            uploadChunk(event.data);
          }
        };

        // 30초마다 데이터를 강제로 내보냄 (config.yaml의 CHUNK_SEC=30.0에 맞춤)
        mediaRecorder.start();
        console.log("🎙️ MediaRecorder Started");

        chunkTimerRef.current = setInterval(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording" && !isPaused) {
            mediaRecorderRef.current.requestData(); // ondataavailable 트리거
          }
        }, 30000);
      })
      .catch((err) => {
        console.error("❌ 마이크 접근 권한 오류:", err);
        setIsRecording(false);
        setFlowState("idle"); // 상태 복구
        alert("마이크 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해 주세요.");
      });

    return () => {
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    };
  }, [isRecording]);

  // --- 타이머 로직 ---
  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused, setRecordingTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setFlowState("recording");
    setRecordingTime(0);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
    }
  };

  // [녹음 중단] -> [저장 중] 단계로 진입
  const handleStopRecordingFlow = async () => {
    setIsRecording(false);
    setFlowState("saving");

    // 마지막 조각 전송 및 중지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }

    try {
      console.log("🛑 Finalizing transcription and saving...");
      const response = await axios.post(`${WHISPER_BACKEND_URL}/end`);
      console.log("✅ All data saved:", response.data);

      setTranscript(`회의가 성공적으로 저장되었습니다. (세그먼트: ${response.data.segments || 0})`);

      // 저장이 완료되면 'completed' 상태로 전환
      setFlowState("completed");
    } catch (error) {
      console.error("❌ Error during saving:", error);
      setFlowState("completed"); // 에러가 나도 일단 버튼은 보여줌
    }
  };

  // [새 회의 시작] - 엔진 유지하며 상태만 리셋
  const handleResetMeeting = async () => {
    try {
      console.log("🔄 Resetting Whisper Backend...");
      await axios.post(`${WHISPER_BACKEND_URL}/reset`);
      setFlowState("idle");
      setRecordingTime(0);
      setTranscript("");
    } catch (error) {
      console.error("❌ Reset failed:", error);
      setFlowState("idle");
    }
  };

  // [회의 종료] - 서버 프로세스 빌린 뒤 앱 종료 안내
  const handleShutdown = async () => {
    if (window.confirm("정말로 회의 시스템을 종료하시겠습니까? (백엔드 서버가 종료됩니다)")) {
      try {
        console.log("👋 Sending Shutdown signal to Whisper Backend...");
        await axios.post(`${WHISPER_BACKEND_URL}/shutdown`);
        alert("시스템 종료 요청이 전달되었습니다. 곧 결과 페이지로 이동합니다.");

        // 회의가 완료된 상태라면 결과 페이지로, 아니면 대시보드로 이동
        if (flowState === "completed") {
          navigate("/result");
        } else {
          navigate("/home");
        }
      } catch (error) {
        console.error("❌ Shutdown failed:", error);
        navigate("/home");
      }
    }
  };

  // 결과 보기 버튼
  const handleViewResult = () => {
    navigate("/result");
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;

    const newMessage = {
      type: "user",
      text: aiInput,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setAiMessages((prev) => [...prev, newMessage]);

    // AI 응답 시뮬레이션 (Home.jsx의 채팅과 동일하게 백엔드 연결 가능)
    setTimeout(() => {
      let aiResponse = "";
      if (aiInput.includes("회의") || aiInput.includes("지난")) {
        aiResponse =
          "지난 회의는 2025-12-20에 진행되었고, RAG 구현과 프론트엔드 개발이 주요 안건이었습니다.";
      } else if (aiInput.includes("이슈") || aiInput.includes("문제")) {
        aiResponse =
          '현재 미해결 이슈는 "Outlook API 연동"과 "STT 정확도 개선"입니다.';
      } else {
        aiResponse =
          "네, 무엇을 도와드릴까요? 회의 내용이나 과거 기록에 대해 질문해주세요.";
      }

      setAiMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: aiResponse,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }, 500);

    setAiInput("");
  };

  if (isProcessing) {
    return (
      <Box textAlign="center" py={20}>
        <VStack spacing={6}>
          <Circle
            size="100px"
            bg="primary.500"
            animation={`${pulse} 1.5s ease-in-out infinite`}
          >
            <FiMic size={40} color="white" />
          </Circle>
          <Heading size="lg" color="primary.500">
            회의록 생성 중...
          </Heading>
          <Text color="gray.600">
            AI가 회의 내용을 분석하고 정리하고 있습니다
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Flex gap={6} py={8} px={4}>
      {/* 왼쪽: 메인 녹음 화면 */}
      <Box flex="1" maxW="700px">
        <Card textAlign="center">
          <VStack spacing={8}>
            {/* 녹음 아이콘 및 상태 */}
            <Circle
              size="150px"
              bg={isRecording ? "red.500" : "gray.400"}
              animation={isRecording ? `${pulse} 2s ease-in-out infinite` : ""}
            >
              <FiMic size={60} color="white" />
            </Circle>

            {/* 타이머 */}
            <VStack spacing={2}>
              <Heading size="2xl" color={isRecording ? "red.500" : "gray.600"}>
                {formatTime(recordingTime)}
              </Heading>
              <HStack>
                <Circle size="12px" bg={isRecording ? (isPaused ? "orange.500" : "red.500") : "gray.300"} />
                <Text fontSize="lg" color="gray.600">
                  {!isRecording ? "녹음 대기 중" : isPaused ? "일시정지 중" : "녹음 중"}
                </Text>
              </HStack>
            </VStack>

            {/* 조작 버튼 영역 */}
            <HStack spacing={4}>
              {flowState === "idle" && (
                <Button
                  size="lg"
                  colorScheme="red"
                  leftIcon={<FiMic />}
                  onClick={handleStartRecording}
                  w="200px"
                  boxShadow="lg"
                  _hover={{ transform: "scale(1.05)" }}
                >
                  녹음 시작
                </Button>
              )}

              {flowState === "recording" && (
                <>
                  <Button
                    size="lg"
                    colorScheme={isPaused ? "green" : "orange"}
                    leftIcon={isPaused ? <FiPlay /> : <FiPause />}
                    onClick={handlePauseResume}
                    w="150px"
                  >
                    {isPaused ? "재개" : "일시정지"}
                  </Button>

                  <Button
                    size="lg"
                    colorScheme="red"
                    leftIcon={<FiSquare />}
                    onClick={handleStopRecordingFlow}
                    w="150px"
                    boxShadow="md"
                  >
                    녹음 종료
                  </Button>
                </>
              )}

              {flowState === "saving" && (
                <VStack>
                  <Spinner size="lg" color="red.500" thickness="4px" />
                  <Text fontWeight="bold" color="red.600">전사 내용 규합 및 저장 중...</Text>
                </VStack>
              )}

              {flowState === "completed" && (
                <HStack spacing={4}>
                  <Button
                    size="lg"
                    colorScheme="purple"
                    leftIcon={<FiMic />}
                    onClick={handleResetMeeting}
                  >
                    새 회의 시작
                  </Button>
                  <Button
                    size="lg"
                    colorScheme="blue"
                    leftIcon={<FiSend />}
                    onClick={handleViewResult}
                  >
                    결과 보기
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    colorScheme="gray"
                    onClick={handleShutdown}
                  >
                    시스템 종료
                  </Button>
                </HStack>
              )}
            </HStack>
          </VStack>
        </Card>

        {/* 실시간 상태 모니터링 창 (원래 STT 창 위치) */}
        <Card mt={6}>
          <Heading size="sm" mb={3}>
            📝 시스템 상태 및 전사 요약
          </Heading>
          <Box
            bg="gray.50"
            p={4}
            borderRadius="8px"
            h="calc(55vh - 150px)"
            overflowY="auto"
            border="1px solid"
            borderColor="gray.200"
          >
            {backendStatus === "loading" ? (
              <VStack spacing={4} pt={10}>
                <Spinner size="lg" color="blue.500" />
                <Text fontSize="sm" color="blue.600" fontWeight="bold">
                  AI 엔진 성능 최적화 중... 잠시만 기다려주세요.
                </Text>
                <Text fontSize="xs" color="gray.500">
                  (최초 실행 시 모델 로딩에 10~20초가 소요될 수 있습니다)
                </Text>
              </VStack>
            ) : backendStatus === "ready" || backendStatus === "connected" ? (
              <VStack spacing={2} align="start">
                <HStack>
                  <Circle size="10px" bg="green.500" />
                  <Text fontSize="sm" color="green.700" fontWeight="bold">연결됨 (음성 분석 가능)</Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  회의 내용이 GPU 서버로 안전하게 전달되고 있습니다.
                  <br />
                  회의가 종료되면 자동으로 화자가 분리된 결과가 생성됩니다.
                </Text>
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500" fontStyle="italic">
                백엔드 서버에 연결 중입니다...
                <br />
                서버가 켜져 있는지 확인해 주세요.
              </Text>
            )}
          </Box>
        </Card>

        {/* 회의 정보 */}
        {currentMeeting && (
          <Card mt={6}>
            <Heading size="sm" mb={3}>
              📅 새 회의
            </Heading>
            <Box bg="gray.50" p={4} borderRadius="12px" w="full">
              <Text fontSize="lg" fontWeight="bold" mb={2}>
                {currentMeeting.title}
              </Text>
              <HStack justify="center" fontSize="sm" color="gray.600">
                <Text>{currentMeeting.date}</Text>
                <Text>·</Text>
                <Text>시작: {currentMeeting.startTime}</Text>
              </HStack>
            </Box>
          </Card>
        )}
      </Box>

      {/* 오른쪽: AI 비서 채팅창 */}
      <Box w="350px">
        <Card h="calc(100vh - 150px)" display="flex" flexDirection="column">
          <Heading size="sm" mb={4}>
            💬 이음 AI 비서
          </Heading>

          {/* 채팅 메시지 */}
          <Box
            flex="1"
            overflowY="auto"
            mb={4}
            p={2}
            bg="gray.50"
            borderRadius="8px"
          >
            <VStack spacing={3} align="stretch">
              {aiMessages.map((msg, idx) => (
                <Box
                  key={idx}
                  alignSelf={msg.type === "user" ? "flex-end" : "flex-start"}
                  maxW="85%"
                >
                  <Box
                    bg={msg.type === "user" ? "primary.500" : "white"}
                    color={msg.type === "user" ? "white" : "gray.800"}
                    p={3}
                    borderRadius="12px"
                    boxShadow="sm"
                  >
                    <Text fontSize="sm">{msg.text}</Text>
                  </Box>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    mt={1}
                    textAlign={msg.type === "user" ? "right" : "left"}
                  >
                    {msg.time}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>

          {/* 입력 창 */}
          <HStack>
            <Input
              placeholder="질문을 입력하세요..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAiSend()}
              size="sm"
            />
            <Button
              colorScheme="primary"
              size="sm"
              leftIcon={<FiSend />}
              onClick={handleAiSend}
            >
              전송
            </Button>
          </HStack>
        </Card>
      </Box>
    </Flex>
  );
}

export default Meeting;
