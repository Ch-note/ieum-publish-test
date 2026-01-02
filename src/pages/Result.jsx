import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Badge,
  Divider,
  Button,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { FiFileText, FiTrendingUp, FiCheckCircle, FiMic } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import ApprovalCenter from "../components/ApprovalCenter";
import { mockMeetingResult } from "../data/mockData";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const WHISPER_BACKEND_URL = import.meta.env.VITE_WHISPER_BACKEND_URL || "http://localhost:8000";
const API_BASE_URL = "/api";

function Result() {
  const navigate = useNavigate();
  // 1. 필수 상태 변수들
  const [tabIndex, setTabIndex] = useState(0);
  const { transcript, setAiSummary, aiSummary } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [realSummary, setRealSummary] = useState("");
  const [resultData, setResultData] = useState(mockMeetingResult); // 기본값 설정
  const toast = useToast();

  // 2. 페이지 진입 시 AI 분석 요청
  useEffect(() => {
    const processMeeting = async () => {
      setIsLoading(true);

      try {
        console.log("📥 Fetching diarization results from Whisper Backend...");
        const response = await axios.get(`${WHISPER_BACKEND_URL}/result`);
        const segments = response.data;

        if (segments && segments.length > 0) {
          // 1. 전체 전사 텍스트 생성 (화자 표시 포함)
          const fullTranscript = segments
            .map(s => `[${s.speaker}] ${s.text}`)
            .join("\n\n");

          setTranscript(fullTranscript);

          // 2. 메인 백엔드로 AI 분석 요청
          console.log("🧠 Sending transcript to Main Backend for deep analysis...");
          const analyzeResponse = await axios.post(`${API_BASE_URL}/analyze-meeting`, {
            summary_text: fullTranscript,
          });

          if (analyzeResponse.data.status === "success") {
            const aiData = analyzeResponse.data.data;

            // 3. 데이터 매핑 (백엔드 JSON 구조 -> 프론트엔드 UI 데이터)
            const safeActionItems = Array.isArray(aiData.actionItems) ? aiData.actionItems : [];
            const safeApprovalItems = safeActionItems.map((item, idx) => ({
              id: `approval-${idx}`,
              type: "todo",
              title: item.task || "할 일 내용 없음",
              description: `담당: ${item.assignee || "미정"} | 기한: ${item.deadline || "추후 협의"}`,
              estimatedTime: "5분",
              details: {
                count: 1,
                assignees: [item.assignee || "담당자 미정"],
                title: item.task,
                date: item.deadline || "추후 협의",
                time: "",
                attendees: [],
                recipients: [],
                subject: item.task,
              },
            }));

            const mergedData = {
              ...mockMeetingResult,
              ...aiData,
              title: "AI 회의 분석 리포트",
              date: new Date().toLocaleDateString(),
              transcript: fullTranscript,
              decisions: Array.isArray(aiData.decisions) ? aiData.decisions : [],
              actionItems: safeActionItems,
              openIssues: Array.isArray(aiData.openIssues) ? aiData.openIssues : [],
              approvalItems: safeApprovalItems,
              insights: {
                meetingType: aiData.insights?.meetingType || "일반 회의",
                sentiment: aiData.insights?.sentiment || "중립",
                keyTopics: Array.isArray(aiData.insights?.keyTopics) ? aiData.insights.keyTopics : [],
                risks: Array.isArray(aiData.insights?.risks) ? aiData.insights.risks : [],
                recommendations: Array.isArray(aiData.insights?.recommendations) ? aiData.insights.recommendations : [],
              },
            };

            setResultData(mergedData);
            setRealSummary(aiData.summary);
            setAiSummary(aiData.summary);
            toast({ title: "분석 완료", status: "success", duration: 3000 });
          }
        }
      } catch (error) {
        console.error("❌ 분석 중 오류 발생:", error);
        toast({
          title: "데이터 로드 실패",
          description: "백엔드 서버 상태를 확인해주세요.",
          status: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    processMeeting();
  }, []); // 페이지 진입 시 1회 실행

  // 3. 메일 발송 함수
  const handleSendEmail = async () => {
    if (!realSummary) {
      toast({ title: "내용 없음", status: "warning" });
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/execute-action`, {
        summary_text: realSummary,
      });
      if (response.data.status === "success") {
        toast({ title: "이메일 발송 성공", status: "success" });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // 4. 화면 렌더링
  return (
    <Box>
      {/* 헤더 */}
      <Card mb={6} bg="linear-gradient(135deg, #4811BF 0%, #8C5CF2 100%)">
        <VStack align="stretch" spacing={3}>
          <Heading size="lg" color="white">
            {resultData.title}
          </Heading>
          <HStack fontSize="sm" color="whiteAlpha.900">
            <Text>{resultData.date}</Text>
            <Text>·</Text>
            <Text>AI 분석 리포트</Text>
          </HStack>
        </VStack>
      </Card>

      {/* 탭 메뉴 */}
      <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="purple">
        <TabList mb={6} bg="white" p={2} borderRadius="12px">
          <Tab>
            <HStack>
              <FiFileText />
              <Text>회의록</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <FiTrendingUp />
              <Text>심층 분석</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <FiCheckCircle />
              <Text>자동화 승인</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: 회의록 */}
          <TabPanel p={0}>
            <VStack align="stretch" spacing={6}>
              <Card>
                <Heading size="md" mb={3}>
                  📝 회의 요약
                </Heading>
                {isLoading ? (
                  <VStack py={8}>
                    <Spinner size="xl" color="purple.500" />
                    <Text mt={4}>AI 분석 중...</Text>
                  </VStack>
                ) : (
                  <Text color="gray.700" lineHeight="1.8" whiteSpace="pre-line">
                    {realSummary || resultData.summary}
                  </Text>
                )}
              </Card>

              {/* 결정사항 */}
              <Card>
                <Heading size="md" mb={3}>
                  ✅ 주요 결정사항
                </Heading>
                <VStack align="stretch" spacing={2}>
                  {resultData.decisions.map((decision, i) => (
                    <HStack key={i} p={3} bg="blue.50" borderRadius="8px">
                      <Badge colorScheme="blue">{i + 1}</Badge>
                      <Text>{decision}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Card>

              {/* 전체 녹음 */}
              <Card>
                <Heading size="md" mb={4}>💬 전체 녹음</Heading>
                <Box bg="gray.50" p={4} borderRadius="8px" fontSize="sm">
                  {transcript || resultData.transcript}
                </Box>

                {/* ▼▼▼ [추가] 회의 재시작 버튼 ▼▼▼ */}
                <Box mt={10} display="flex" justifyContent="center" gap={4}>
                  <Button
                    size="lg"
                    leftIcon={<FiMic />}
                    colorScheme="purple"
                    onClick={async () => {
                      if (window.confirm("새 회의를 시작하시겠습니까? (이전 데이터는 초기화됩니다)")) {
                        try {
                          await axios.post(`${WHISPER_BACKEND_URL}/reset`);
                          navigate("/meeting");
                        } catch (err) {
                          console.error("재시작 실패:", err);
                          navigate("/meeting");
                        }
                      }
                    }}
                  >
                    새 회의 바로 시작
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    홈으로 돌아가기
                  </Button>
                </Box>
              </Card>
            </VStack>
          </TabPanel>

          {/* Tab 2: 심층 분석 */}
          <TabPanel p={0}>
            <VStack align="stretch" spacing={6}>
              <Card>
                <Heading size="md">📊 회의 분석</Heading>
                <Text>유형: {resultData.insights.meetingType}</Text>
                <Text>분위기: {resultData.insights.sentiment}</Text>
              </Card>
              {/* 리스크 분석 */}
              <Card>
                <Heading size="md" mb={3}>
                  ⚠️ 리스크 분석
                </Heading>
                <VStack align="stretch">
                  {resultData.insights.risks.map((risk, i) => (
                    <Box key={i} p={3} bg="red.50" borderRadius="8px">
                      <Text fontWeight="bold">{risk.level.toUpperCase()}</Text>
                      <Text>{risk.description}</Text>
                    </Box>
                  ))}
                </VStack>
              </Card>
            </VStack>
          </TabPanel>

          {/* Tab 3: 자동화 승인 */}
          <TabPanel p={0}>
            <VStack align="stretch" spacing={6}>
              {/* ▼▼▼ [디자인 복구] 팀원이 만든 차별화 포인트 강조 카드 ▼▼▼ */}
              <Card bg="linear-gradient(to right, #f3e8ff, #e9d5ff)">
                <HStack spacing={4} align="start">
                  <Box p={3} bg="white" borderRadius="12px" boxShadow="sm">
                    <Text fontSize="3xl">🚀</Text>
                  </Box>
                  <Box flex="1">
                    <Heading size="md" mb={2} color="purple.600">
                      이음의 차별화 포인트!
                    </Heading>
                    <Text color="gray.700" fontSize="sm" lineHeight="1.8">
                      Notion AI는 회의록을 저장하는 것으로 끝나지만,
                      <strong>
                        {" "}
                        이음은 회의 종료 후 자동으로 실행까지 연결
                      </strong>
                      합니다.
                      <br />
                      아래 항목을 체크하고 승인하면{" "}
                      <strong>수동 작업 15분을 3초로 단축</strong>할 수
                      있습니다.
                    </Text>
                  </Box>
                </HStack>
              </Card>

              {/* 
                  ▼▼▼ [기능 연결] ▼▼▼ 
                  1. approvalItems: 백엔드 데이터 연결
                  2. onSendEmail: 우리가 만든 메일 발송 함수 연결
              */}
              <ApprovalCenter
                approvalItems={resultData.approvalItems}
                onSendEmail={handleSendEmail}
              />

              {/* 🚨 아까 제가 추가했던 별도의 '승인 버튼' 박스는 제거했습니다. 
                  (ApprovalCenter 안에 이미 예쁜 버튼이 있으니까요!) */}
              <Box pt={6} pb={10}></Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default Result;
