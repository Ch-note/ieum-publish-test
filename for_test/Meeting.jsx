import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Circle,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { FiMic, FiSquare, FiPause, FiPlay } from "react-icons/fi";
import Card from "../components/Card";
import { useAppContext } from "../context/AppContext";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

// ▼▼▼ [추가됨] Azure 키 설정 (나중엔 .env로 빼세요) ▼▼▼
const SPEECH_KEY = import.meta.env.VITE_SPEECH_KEY;
const SPEECH_REGION = import.meta.env.VITE_SPEECH_REGION;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
`;

function Meeting() {
  const navigate = useNavigate();
  const {
    currentMeeting,
    isRecording,
    recordingTime,
    setRecordingTime,
    stopRecording,
    setTranscript,
  } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ▼▼▼ [추가됨] 녹음 데이터 저장용 로컬 변수 ▼▼▼
  const [localTranscript, setLocalTranscript] = useState("");
  const recognizerRef = useRef(null); // SDK 객체 저장용

  // --- [1] 페이지 로드 시 Azure 녹음기 시동 ---
  useEffect(() => {
    //  [핵심] 이미 녹음기가 켜져 있으면 또 켜지 말고 돌아가! (중복 방지)
    if (recognizerRef.current) return;

    let recognizer;

    try {
      // 키 확인 안전장치
      if (!SPEECH_KEY || SPEECH_KEY.includes("붙여넣기")) {
        console.warn("⚠️ Azure Speech Key가 설정되지 않았습니다.");
        return;
      }

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        SPEECH_KEY,
        SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = "ko-KR";

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          // console.log("인식됨:", e.result.text);
          setLocalTranscript((prev) => prev + " " + e.result.text);
        }
      };

      recognizer.startContinuousRecognitionAsync(() => {
        console.log("🎙️ Azure 녹음 시작됨 (한 번만 실행되어야 함)");
      });

      recognizerRef.current = recognizer;
    } catch (error) {
      console.error("❌ Azure SDK 초기화 오류:", error);
    }

    // 페이지 나갈 때 정리 (Cleanup)
    return () => {
      if (recognizer) {
        recognizer.stopContinuousRecognitionAsync(() => {
          recognizer.close(); // 자원 해제
        });
      }
      recognizerRef.current = null; // 초기화
    };
  }, []);

  // --- 기존 타이머 로직 (그대로 유지) ---

  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused, setRecordingTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  // ▼▼▼ [수정됨] 종료 버튼 클릭 시 로직 ▼▼▼
  const handleStopRecording = () => {
    stopRecording(); // Context 상태 변경
    setIsProcessing(true); // 로딩 화면 보여주기

    // Azure 녹음기 끄기
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(() => {
        console.log("🛑 녹음 종료. 저장된 내용:", localTranscript);

        // [중요] 전역 Context에 녹음본 저장
        setTranscript(localTranscript);
        localStorage.setItem("lastTranscript", localTranscript); // ★ 추가

        // 2초 후 결과 화면으로 이동 (팀원이 만든 시뮬레이션 효과 유지)
        setTimeout(() => {
          setIsProcessing(false);
          navigate("/result"); // /result 뒤에 ID(/999)는 빼도 됩니다. Result 페이지에서 Context를 쓰니까요.
        }, 2000);
      });
    } else {
      // 혹시 녹음기가 안 켜졌을 경우 대비
      setTimeout(() => {
        setIsProcessing(false);
        navigate("/result");
      }, 2000);
    }
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

  // --- UI 부분은 팀원 코드 100% 그대로 유지 ---

  return (
    <Box maxW="800px" mx="auto" py={8}>
      <Card textAlign="center">
        <VStack spacing={8}>
          {/* 녹음 중 애니메이션 */}
          <Circle
            size="150px"
            bg="red.500"
            animation={`${pulse} 2s ease-in-out infinite`}
          >
            <FiMic size={60} color="white" />
          </Circle>

          {/* 타이머 */}
          <VStack spacing={2}>
            <Heading size="2xl" color="red.500">
              {formatTime(recordingTime)}
            </Heading>
            <HStack>
              <Circle size="12px" bg={isPaused ? "orange.500" : "red.500"} />
              <Text fontSize="lg" color="gray.600">
                {isPaused ? "일시정지 중" : "녹음 중"}
              </Text>
            </HStack>
          </VStack>

          {/* 회의 정보 */}
          {currentMeeting && (
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
          )}

          {/* 안내 메시지 */}
          <Box bg="blue.50" p={4} borderRadius="12px" w="full">
            <Text fontSize="sm" color="blue.700" textAlign="center">
              💡 회의가 끝나면 "종료" 버튼을 눌러주세요.
              <br />
              이음이 자동으로 회의록을 정리하고 액션 아이템을 추출합니다.
            </Text>
          </Box>

          {/* 일시정지 / 종료 버튼 */}
          <HStack spacing={4}>
            <Button
              size="lg"
              colorScheme={isPaused ? "green" : "orange"}
              leftIcon={isPaused ? <FiPlay /> : <FiPause />}
              onClick={handlePauseResume}
              w="150px"
              _hover={{ transform: "scale(1.05)" }}
              transition="all 0.2s"
            >
              {isPaused ? "재개" : "일시정지"}
            </Button>

            <Button
              size="lg"
              colorScheme="red"
              leftIcon={<FiSquare />}
              onClick={handleStopRecording}
              w="150px"
              _hover={{ transform: "scale(1.05)" }}
              transition="all 0.2s"
            >
              회의 종료
            </Button>
          </HStack>
        </VStack>
      </Card>

      {/* AI 비서 채팅 (추후 확장) */}
      <Card mt={6}>
        <Heading size="sm" mb={3}>
          💬 AI 비서
        </Heading>
        <Box bg="gray.50" p={3} borderRadius="8px">
          <Text fontSize="sm" color="gray.600">
            회의 중 궁금한 점이 있으면 물어보세요!
            <br />
            예: "지난 마케팅 회의에서 예산은 얼마였지?"
          </Text>
        </Box>
      </Card>
    </Box>
  );
}

export default Meeting;
