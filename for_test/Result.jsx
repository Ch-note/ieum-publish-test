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
import { FiFileText, FiTrendingUp, FiCheckCircle } from "react-icons/fi";
import Card from "../components/Card";
import ApprovalCenter from "../components/ApprovalCenter";
import { mockMeetingResult } from "../data/mockData";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

function Result() {
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
      // 녹음 내용 없으면 로딩 끄고 종료
      if (!transcript) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.post("/api/analyze-meeting", {
          summary_text: transcript,
        });

        if (response.data.status === "success") {
          const aiData = response.data.data;

          // [핵심] ApprovalCenter가 터지지 않게 데이터 강제 주입
          const safeActionItems = Array.isArray(aiData.actionItems)
            ? aiData.actionItems
            : [];

          const safeApprovalItems = safeActionItems.map((item, idx) => ({
            id: `approval-${idx}`,
            type: "todo", // 무조건 todo로 통일 (아이콘 에러 방지)
            title: item.task || "할 일 내용 없음",
            description: `담당: ${item.assignee || "미정"}`,
            estimatedTime: "5분",
            // ★ 여기가 제일 중요: ApprovalCenter가 요구하는 모든 필드를 다 넣어줌
            details: {
              count: 1,
              assignees: [item.assignee || "담당자 미정"], // 배열 필수
              title: item.task,
              date: "추후 협의",
              time: "",
              attendees: [], // 배열 필수
              recipients: [], // 배열 필수
              subject: item.task,
            },
          }));

          // 데이터 병합
          const mergedData = {
            ...mockMeetingResult, // 목데이터 베이스
            ...aiData, // AI 데이터 덮어쓰기
            title: "AI 분석 완료된 회의",
            date: new Date().toLocaleDateString(),

            // 배열 안전장치
            decisions: Array.isArray(aiData.decisions) ? aiData.decisions : [],
            actionItems: safeActionItems,
            openIssues: Array.isArray(aiData.openIssues)
              ? aiData.openIssues
              : [],
            approvalItems: safeApprovalItems, // 위에서 만든 안전한 데이터

            insights: {
              meetingType: aiData.insights?.meetingType || "일반 회의",
              sentiment: aiData.insights?.sentiment || "중립",
              keyTopics: Array.isArray(aiData.insights?.keyTopics)
                ? aiData.insights.keyTopics
                : [],
              risks: Array.isArray(aiData.insights?.risks)
                ? aiData.insights.risks
                : [],
              recommendations: Array.isArray(aiData.insights?.recommendations)
                ? aiData.insights.recommendations
                : [],
            },
          };

          setResultData(mergedData);
          setRealSummary(aiData.summary);
          setAiSummary(aiData.summary);

          toast({ title: "분석 완료", status: "success", duration: 3000 });
        }
      } catch (error) {
        console.error("분석 에러:", error);
        toast({
          title: "분석 실패",
          description: "서버 연결 확인 필요",
          status: "error",
        });
      } finally {
        setIsLoading(false); // 무조건 로딩 끔
      }
    };

    processMeeting();
  }, [transcript]);

  // 3. 메일 발송 함수
  const handleSendEmail = async () => {
    if (!realSummary) {
      toast({ title: "내용 없음", status: "warning" });
      return;
    }
    try {
      // ApprovalCenter 내부에서 로딩을 관리하므로 여기선 상태 변경 X
      const response = await axios.post("/api/execute-action", {
        summary_text: realSummary,
      });
      if (response.data.status === "success") {
        console.log("메일 발송 성공");
      }
    } catch (error) {
      console.error(error);
      throw error; // 에러를 던져야 자식 컴포넌트가 실패 처리를 함
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
                <Heading size="md">💬 전체 녹음</Heading>
                <Box bg="gray.50" p={4} borderRadius="8px" fontSize="sm">
                  {transcript || resultData.transcript}
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
