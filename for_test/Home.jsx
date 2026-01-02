import React, { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
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
// Mock data imports removed
import { useAppContext } from "../context/AppContext";

function Home() {
  const navigate = useNavigate();
  const [realMeetings, setRealMeetings] = useState([]);
  const [realIssues, setRealIssues] = useState([]);
  const [realAgendas, setRealAgendas] = useState([]);
  const { startMeeting } = useAppContext();
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "안녕하세요! 이음 AI 비서입니다. 무엇을 도와드릴까요? 😊",
      time: "10:30",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // --- [수정] 백엔드에서 3가지 데이터를 다 가져옴 ---
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get("/api/dashboard-data");

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

  const handleSendMessage = () => {
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

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: getAIResponse(chatInput),
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 1000);

    setChatInput("");
  };

  const getAIResponse = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("회의") || lowerInput.includes("미팅")) {
      return '지난 회의 내역을 확인하실 수 있습니다. 아래 "최근 회의" 목록을 확인해보세요!';
    } else if (lowerInput.includes("이슈") || lowerInput.includes("미해결")) {
      return `현재 ${realIssues.length}개의 미해결 이슈가 있습니다. 왼쪽 카드를 확인해보세요!`;
    } else if (lowerInput.includes("안녕") || lowerInput.includes("하이")) {
      return "안녕하세요! 오늘도 좋은 하루 보내세요 😊";
    } else {
      return "질문주셔서 감사합니다! 회의, 이슈, 과거 기록 등에 대해 물어보세요.";
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
          />
          <InputRightElement width="4.5rem">
            <Button
              h="1.75rem"
              size="sm"
              colorScheme="purple"
              onClick={handleSendMessage}
              leftIcon={<FiSend />}
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

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        {/* 1. 미해결 이슈 카드 */}
        <Card>
          <HStack mb={4} justify="space-between">
            <HStack>
              <FiAlertCircle color="#4811BF" size={24} />
              <Heading size="md">미해결 이슈</Heading>
            </HStack>
            <Badge colorScheme="red">
              {realIssues.length}개
            </Badge>
          </HStack>

          <VStack align="stretch" spacing={3}>
            {/* ▼▼▼ 여기는 이슈(issue)를 돌려야 함! ▼▼▼ */}
            {realIssues.map(
              (issue, index) => (
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
              )
            )}
          </VStack>
        </Card>

        {/* 2. 제안된 다음 안건 카드 */}
        <Card>
          <HStack mb={4}>
            <FiClock color="#09A603" size={24} />
            <Heading size="md">다음 회의 추천 안건</Heading>
          </HStack>

          <VStack align="stretch" spacing={3}>
            {/* ▼▼▼ 여기는 안건(agenda)을 돌려야 함! ▼▼▼ */}
            {realAgendas.map(
              (agenda, index) => (
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
              )
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

      {/* 최근 회의 목록 */}
      <Card>
        <Heading size="md" mb={4}>
          최근 회의
        </Heading>

        <VStack align="stretch" spacing={3}>
          {/* 실제 데이터가 있으면 그것을, 없으면 가짜 데이터 사용 */}
          {realMeetings.map(
            (meeting) => (
              <Box
                key={meeting.id}
                p={4}
                bg="gray.50"
                borderRadius="12px"
                cursor="pointer"
                _hover={{ bg: "gray.100", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                // 클릭 시 결과 페이지로 이동하며 데이터 전달
                onClick={() =>
                  navigate("/result", { state: { meetingData: meeting } })
                }
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold" fontSize="lg">
                    {meeting.title}
                  </Text>
                  {/* 실제 데이터는 badge 정보가 없으므로 '분석 완료'로 통일 */}
                  <Badge colorScheme="green">분석 완료</Badge>
                </HStack>

                <HStack fontSize="sm" color="gray.600" mb={2}>
                  <Text>{meeting.date}</Text>
                  <Text>·</Text>
                  <Text>AI 요약본 저장됨</Text>
                </HStack>

                <Text fontSize="sm" color="gray.500" noOfLines={2}>
                  {/* 요약 내용 미리보기 */}
                  {meeting.summary}
                </Text>
              </Box>
            )
          )}
        </VStack>
      </Card>
    </Box>
  );
}

export default Home;
