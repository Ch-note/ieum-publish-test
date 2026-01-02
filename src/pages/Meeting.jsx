import React, { useState } from "react";
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

function Meeting() {
  const navigate = useNavigate();
  const {
    currentMeeting,
    isRecording,
    isPaused,
    recordingTime,
    flowState,
    backendStatus,
    aiMessages, setAiMessages,
    handleStartRecording,
    handlePauseResume,
    handleStopRecordingFlow,
    handleResetMeeting,
  } = useAppContext();

  const [aiInput, setAiInput] = useState("");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleShutdown = async () => {
    if (window.confirm("회의 시스템을 종료하시겠습니까? (백엔드 서버 종료)")) {
      alert("시스템 종료 요청이 전달되었습니다.");
      navigate("/home");
    }
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const newMessage = {
      type: "user",
      text: aiInput,
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };
    setAiMessages((prev) => [...prev, newMessage]);
    setAiInput("");
    setTimeout(() => {
      setAiMessages((prev) => [...prev, {
        type: "ai",
        text: "네, 회의 내용에 대해 궁금하신 점을 말씀해주세요.",
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 1000);
  };

  return (
    <Flex gap={6} py={8} px={4}>
      <Box flex="1" maxW="700px">
        <Card textAlign="center">
          <VStack spacing={8}>
            <Circle
              size="150px"
              bg={isRecording ? "red.500" : "gray.400"}
              animation={isRecording && !isPaused ? `${pulse} 2s ease-in-out infinite` : ""}
            >
              <FiMic size={60} color="white" />
            </Circle>

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

            <HStack spacing={4}>
              {flowState === "idle" && (
                <Button size="lg" colorScheme="red" leftIcon={<FiMic />} onClick={handleStartRecording} w="200px">
                  녹음 시작
                </Button>
              )}
              {flowState === "recording" && (
                <>
                  <Button size="lg" colorScheme={isPaused ? "green" : "orange"} leftIcon={isPaused ? <FiPlay /> : <FiPause />} onClick={handlePauseResume} w="150px">
                    {isPaused ? "재개" : "일시정지"}
                  </Button>
                  <Button size="lg" colorScheme="red" leftIcon={<FiSquare />} onClick={handleStopRecordingFlow} w="150px">
                    녹음 종료
                  </Button>
                </>
              )}
              {flowState === "saving" && (
                <VStack>
                  <Spinner size="lg" color="red.500" thickness="4px" />
                  <Text fontWeight="bold" color="red.600">전사 내용 저장 중...</Text>
                </VStack>
              )}
              {flowState === "completed" && (
                <HStack spacing={4}>
                  <Button size="lg" colorScheme="purple" leftIcon={<FiMic />} onClick={handleResetMeeting}>새 회의 시작</Button>
                  <Button size="lg" colorScheme="blue" leftIcon={<FiSend />} onClick={() => navigate("/result")}>결과 보기</Button>
                  <Button size="lg" variant="outline" onClick={handleShutdown}>시스템 종료</Button>
                </HStack>
              )}
            </HStack>
          </VStack>
        </Card>

        <Card mt={6}>
          <Heading size="sm" mb={3}>📝 시스템 상태</Heading>
          <Box bg="gray.50" p={4} borderRadius="8px" h="150px">
            {backendStatus === "loading" ? (
              <VStack spacing={4} pt={4}>
                <Spinner size="md" color="blue.500" />
                <Text fontSize="sm" color="blue.600" fontWeight="bold">AI 엔진 로딩 중...</Text>
              </VStack>
            ) : backendStatus === "connected" || backendStatus === "ready" ? (
              <VStack align="start">
                <HStack><Circle size="10px" bg="green.500" /><Text fontWeight="bold" color="green.700">연결됨 (음성 분석 가능)</Text></HStack>
                <Text fontSize="sm" color="gray.600">서버가 준비되었습니다. 녹음을 시작해주세요.</Text>
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">서버에 연결 중입니다...</Text>
            )}
          </Box>
        </Card>
      </Box>

      <Box w="350px">
        <Card h="calc(100vh - 150px)" display="flex" flexDirection="column">
          <Heading size="sm" mb={4}>💬 이음 AI 비서</Heading>
          <Box flex="1" overflowY="auto" mb={4} p={2} bg="gray.50" borderRadius="8px">
            <VStack spacing={3} align="stretch">
              {aiMessages.map((msg, idx) => (
                <Box key={idx} alignSelf={msg.type === "user" ? "flex-end" : "flex-start"} maxW="85%">
                  <Box bg={msg.type === "user" ? "primary.500" : "white"} color={msg.type === "user" ? "white" : "gray.800"} p={3} borderRadius="12px" boxShadow="sm">
                    <Text fontSize="sm">{msg.text}</Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1} textAlign={msg.type === "user" ? "right" : "left"}>{msg.time}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
          <HStack>
            <Input placeholder="질문 입력..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleAiSend()} size="sm" />
            <Button colorScheme="primary" size="sm" leftIcon={<FiSend />} onClick={handleAiSend}>전송</Button>
          </HStack>
        </Card>
      </Box>
    </Flex>
  );
}

export default Meeting;
