import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Button,
  SimpleGrid,
  Text,
  HStack,
  Badge,
  VStack,
  Input,
  InputGroup,
  InputRightElement,
  Divider,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FiMic,
  FiClock,
  FiAlertCircle,
  FiSend,
  FiMessageCircle,
} from "react-icons/fi";
import Card from "../components/Card";
import { useAppContext } from "../context/AppContext";

// SWA 통합 API 배포 시 프론트엔드와 동일 도메인의 /api 경로를 사용합니다.
const API_BASE_URL = "/api";

function Home() {
  const navigate = useNavigate();
  const { startMeeting } = useAppContext();

  // ▼▼▼ [Real Tech] 실제 DB 데이터 상태 ▼▼▼
  const [realMeetings, setRealMeetings] = useState([]);
  const [realIssues, setRealIssues] = useState([]);
  const [realAgendas, setRealAgendas] = useState([]);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "안녕하세요! 이음 AI 비서입니다. 무엇을 도와드릴까요? 😊",
      time: "10:30",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- [1] 대시보드 데이터 로드 (Real RAG Data) ---
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/dashboard-data`);

        if (response.data.status === "success") {
          // 1. 회의 목록 저장
          setRealMeetings(response.data.meetings);

          // 2. 미해결 이슈 저장 (없으면 빈 배열)
          setRealIssues(response.data.open_issues || []);

          // 3. 추천 안건 저장 (없으면 빈 배열)
          setRealAgendas(response.data.suggested_agenda || []);
        }
      } catch (e) {
        console.error("대시보드 로딩 실패:", e);
      }
    };

    fetchDashboard();
  }, []);

  const handleStartMeeting = () => {
    const newMeeting = {
      id: Date.now(),
      title: "새 회의",
      date: new Date().toISOString().split("T")[0],
      startTime: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    startMeeting(newMeeting);
    navigate("/meeting");
  };

  // --- [2] AI 비서 채팅 (Real Chat) ---
  const handleSendMessage = async () => {
    if (chatInput.trim() === "") return;

    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: chatInput,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput(""); // 입력창 초기화 먼저

    setIsLoading(true);

    try {
      // 메인 비즈니스 백엔드로 전송 (채팅/RAG)
      const response = await axios.post(`${API_BASE_URL}/chat`, { message: userMessage.text });

      // axios는 response.data를 바로 사용
      const data = response.data;

      // AI 응답 화면 표시
      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: data.answer,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: "죄송합니다. 서버 연결에 실패했습니다. (백엔드가 켜져있나요?)",
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Heading size="xl" mb={6}>
        안녕하세요, 김프로님 👋
      </Heading>

      {/* 회의 시작 버튼 */}
      <Card mb={6} bg="linear-gradient(135deg, #4811BF 0%, #8C5CF2 100%)">
        <HStack justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="white" mb={2}>
              새 회의 시작하기
            </Heading>
            <Text color="whiteAlpha.900" fontSize="md">
              회의를 녹음하고 자동으로 정리해보세요
            </Text>
          </Box>
          <Button
            size="lg"
            leftIcon={<FiMic />}
            colorScheme="whiteAlpha"
            bg="white"
            color="primary.500"
            onClick={handleStartMeeting}
            _hover={{ transform: "scale(1.05)" }}
            transition="all 0.2s"
          >
            회의 시작
          </Button>
        </HStack>
      </Card>

      {/* AI 비서 대화창 */}
      <Card mb={6}>
        <HStack mb={4} justify="space-between">
          <HStack>
            <FiMessageCircle color="#4811BF" size={24} />
            <Heading size="md">AI 비서 (이음)와 대화하기</Heading>
          </HStack>
          <Badge colorScheme="green">온라인</Badge>
        </HStack>

        {/* 대화 메시지 */}
        <Box
          bg="gray.50"
          borderRadius="12px"
          p={4}
          mb={4}
          maxH="300px"
          overflowY="auto"
        >
          <VStack align="stretch" spacing={3}>
            {chatMessages.map((msg) => (
              <HStack
                key={msg.id}
                justify={msg.sender === "user" ? "flex-end" : "flex-start"}
              >
                <Box
                  bg={msg.sender === "user" ? "primary.500" : "white"}
                  color={msg.sender === "user" ? "white" : "gray.800"}
                  px={4}
                  py={2}
                  borderRadius="12px"
                  maxW="70%"
                  boxShadow="sm"
                >
                  <Text fontSize="sm">{msg.text}</Text>
                  <Text
                    fontSize="xs"
                    color={
                      msg.sender === "user" ? "whiteAlpha.800" : "gray.500"
                    }
                    mt={1}
                  >
                    {msg.time}
                  </Text>
                </Box>
              </HStack>
            ))}
            {isLoading && (
              <HStack justify="flex-start">
                <Box bg="white" px={4} py={2} borderRadius="12px">
                  <Text fontSize="sm" color="gray.500">AI가 답변을 생각주입니다...</Text>
                </Box>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* 입력창 */}
        <InputGroup size="lg">
          <Input
            placeholder="이음 AI에게 물어보세요... (예: 지난 회의 내용은?)"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            bg="white"
            borderColor="gray.300"
            disabled={isLoading}
          />
          <InputRightElement width="4.5rem">
            <Button
              h="1.75rem"
              size="sm"
              colorScheme="purple"
              onClick={handleSendMessage}
              leftIcon={<FiSend />}
              isLoading={isLoading}
            >
              전송
            </Button>
          </InputRightElement>
        </InputGroup>

        <Text fontSize="xs" color="gray.500" mt={2}>
          팁: "지난 마케팅 회의에서 예산은 얼마였지?" 같은 질문을 해보세요!
        </Text>
      </Card>

      <Divider mb={6} />

      {/* 차별화 포인트 영역 (Real Data) */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        {/* 미해결 이슈 */}
        <Card>
          <HStack mb={4} justify="space-between">
            <HStack>
              <FiAlertCircle color="#4811BF" size={24} />
              <Heading size="md">미해결 이슈</Heading>
            </HStack>
            <Badge colorScheme="red">{realIssues.length}개</Badge>
          </HStack>

          <VStack align="stretch" spacing={3}>
            {realIssues.length > 0 ? (
              realIssues.map((issue, index) => (
                <Box
                  key={index}
                  p={3}
                  bg="red.50"
                  borderRadius="8px"
                  borderLeft="4px solid"
                  borderColor="red.500"
                  cursor="pointer"
                  _hover={{ bg: "red.100" }}
                >
                  <Text fontWeight="bold" fontSize="sm" mb={1}>
                    {issue.title}
                  </Text>
                  <HStack fontSize="xs" color="gray.600">
                    <Text>마지막 언급: {issue.lastMentioned}</Text>
                    <Text>·</Text>
                    <Text>담당: {issue.owner}</Text>
                  </HStack>
                </Box>
              ))
            ) : (
              <Text color="gray.500" fontSize="sm" py={2}>미해결 이슈가 없습니다. (RAG 데이터 없음)</Text>
            )}
          </VStack>
        </Card>

        {/* 제안된 다음 안건 */}
        <Card>
          <HStack mb={4}>
            <FiClock color="#09A603" size={24} />
            <Heading size="md">다음 회의 추천 안건</Heading>
          </HStack>

          <VStack align="stretch" spacing={3}>
            {realAgendas.length > 0 ? (
              realAgendas.map((agenda, index) => (
                <HStack
                  key={index}
                  p={3}
                  bg="green.50"
                  borderRadius="8px"
                  borderLeft="4px solid"
                  borderColor="green.500"
                >
                  <Badge colorScheme="green">{index + 1}</Badge>
                  <Text fontSize="sm">{agenda}</Text>
                </HStack>
              ))
            ) : (
              <Text color="gray.500" fontSize="sm" py={2}>추천 안건이 없습니다. (RAG 데이터 없음)</Text>
            )}
          </VStack>

          <Button
            mt={4}
            size="sm"
            colorScheme="green"
            variant="outline"
            width="full"
          >
            안건 추가하기
          </Button>
        </Card>
      </SimpleGrid>

      {/* 최근 회의 목록 (Real Data) */}
      <Card>
        <Heading size="md" mb={4}>
          최근 회의
        </Heading>

        <VStack align="stretch" spacing={3}>
          {realMeetings.length > 0 ? (
            realMeetings.map((meeting) => (
              <Box
                key={meeting.id}
                p={4}
                bg="gray.50"
                borderRadius="12px"
                cursor="pointer"
                _hover={{ bg: "gray.100", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                onClick={() => navigate("/result", { state: { meetingData: meeting } })}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold" fontSize="lg">
                    {meeting.title}
                  </Text>
                  <Badge colorScheme="green">분석 완료</Badge>
                </HStack>

                <HStack fontSize="sm" color="gray.600" mb={2}>
                  <Text>{meeting.date}</Text>
                  <Text>·</Text>
                  <Text>AI 요약본 저장됨</Text>
                </HStack>

                <Text fontSize="sm" color="gray.500" noOfLines={2}>
                  {meeting.summary}
                </Text>
              </Box>
            ))
          ) : (
            <Text color="gray.500" py={4} textAlign="center">
              최근 회의 기록이 없습니다. (Azure Search에서 데이터를 찾을 수 없습니다)
            </Text>
          )}
        </VStack>
      </Card>
    </Box>
  );
}

export default Home;
