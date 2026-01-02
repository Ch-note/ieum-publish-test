import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  List,
  ListItem,
  Badge,
  useToast,
  Progress,
  SimpleGrid,
} from "@chakra-ui/react";
import { FiUpload, FiFile, FiTrash2, FiCheckCircle } from "react-icons/fi";
import Card from "../components/Card";

function Upload() {
  // 각 섹션별 파일 상태 관리
  const [ieumFiles, setIeumFiles] = useState([
    {
      id: 1,
      name: "2024년 마케팅 전략_이음AI.pdf",
      size: "2.3 MB",
      type: "PDF",
      uploadDate: "2025-12-20",
      status: "completed",
    },
  ]);

  const [customFiles, setCustomFiles] = useState([]);

  const [externalFiles, setExternalFiles] = useState([
    {
      id: 2,
      name: "개발 가이드라인.docx",
      size: "1.1 MB",
      type: "DOCX",
      uploadDate: "2025-12-22",
      status: "completed",
    },
  ]);

  const [isUploading, setIsUploading] = useState({
    ieum: false,
    custom: false,
    external: false,
  });
  const [uploadProgress, setUploadProgress] = useState({
    ieum: 0,
    custom: 0,
    external: 0,
  });
  const toast = useToast();

  // 파일 크기 제한 (100MB)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

  // 파일 업로드 핸들러 (섹션별 + 용량 검증)
  const handleFileSelect = (event, section) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    // 파일 크기 검증
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        });
      } else {
        validFiles.push(file);
      }
    });

    // 용량 초과 파일이 있는 경우 경고
    if (invalidFiles.length > 0) {
      const invalidFilesList = invalidFiles
        .map((f) => `• ${f.name} (${f.size})`)
        .join("\n");

      toast({
        title: "⚠️ 파일 크기 초과",
        description: `다음 파일은 100MB를 초과하여 업로드할 수 없습니다:\n\n${invalidFilesList}\n\n파일을 압축하거나 분할 후 다시 시도해주세요.`,
        status: "error",
        duration: 6000,
        isClosable: true,
      });

      // 초과 파일만 있고 정상 파일이 없으면 종료
      if (validFiles.length === 0) {
        event.target.value = ""; // input 초기화
        return;
      }

      // 일부 파일만 초과한 경우 안내
      toast({
        title: "📋 일부 파일만 업로드됩니다",
        description: `${validFiles.length}개 파일은 정상적으로 업로드됩니다.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }

    // 정상 파일만 업로드 진행
    if (validFiles.length > 0) {
      setIsUploading((prev) => ({ ...prev, [section]: true }));
      setUploadProgress((prev) => ({ ...prev, [section]: 0 }));

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const currentProgress = prev[section];
          if (currentProgress >= 100) {
            clearInterval(interval);
            setIsUploading((prevState) => ({ ...prevState, [section]: false }));

            // 파일 추가
            const newFiles = validFiles.map((file, index) => ({
              id: Date.now() + index,
              name: file.name,
              size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
              type: file.name.split(".").pop().toUpperCase(),
              uploadDate: new Date().toISOString().split("T")[0],
              status: "completed",
            }));

            // 섹션별로 파일 추가
            if (section === "ieum") {
              setIeumFiles((prevFiles) => [...newFiles, ...prevFiles]);
            } else if (section === "custom") {
              setCustomFiles((prevFiles) => [...newFiles, ...prevFiles]);
            } else if (section === "external") {
              setExternalFiles((prevFiles) => [...newFiles, ...prevFiles]);
            }

            toast({
              title: "✅ 업로드 완료!",
              description: `${validFiles.length}개 파일이 RAG 시스템에 추가되었습니다`,
              status: "success",
              duration: 3000,
            });

            event.target.value = ""; // input 초기화
            return { ...prev, [section]: 0 };
          }
          return { ...prev, [section]: currentProgress + 10 };
        });
      }, 200);
    }
  };

  // 파일 삭제 핸들러 (섹션별)
  const handleDelete = (id, section) => {
    if (section === "ieum") {
      setIeumFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    } else if (section === "custom") {
      setCustomFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    } else if (section === "external") {
      setExternalFiles((prevFiles) =>
        prevFiles.filter((file) => file.id !== id)
      );
    }

    toast({
      title: "파일 삭제됨",
      description: "RAG 데이터베이스에서 제거되었습니다",
      status: "info",
      duration: 2000,
    });
  };

  // 업로드 섹션 컴포넌트
  const UploadSection = ({
    title,
    description,
    bgGradient,
    fileList,
    section,
    acceptedFormats,
  }) => (
    <Card p={4} flex="1" minH="400px" display="flex" flexDirection="column">
      {/* 업로드 영역 */}
      <Box bg={bgGradient} p={6} borderRadius="12px" mb={4} textAlign="center">
        <VStack spacing={3}>
          <Icon as={FiUpload} boxSize={10} color="white" />
          <Heading size="sm" color="white">
            {title}
          </Heading>
          <Text color="whiteAlpha.900" fontSize="xs" textAlign="center">
            {description}
          </Text>

          <Button
            as="label"
            htmlFor={`file-upload-${section}`}
            size="sm"
            bg="white"
            color="primary.500"
            leftIcon={<FiUpload />}
            cursor="pointer"
            _hover={{ transform: "scale(1.05)" }}
            transition="all 0.2s"
            isDisabled={isUploading[section]}
          >
            파일 선택
          </Button>
          <input
            id={`file-upload-${section}`}
            type="file"
            accept={acceptedFormats}
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFileSelect(e, section)}
          />

          <Text fontSize="xs" color="whiteAlpha.800">
            {acceptedFormats === ".pdf,.docx,.doc"
              ? "PDF, DOCX | 최대 100MB"
              : "PDF, DOCX, PPT, 이미지 | 최대 100MB"}
          </Text>
        </VStack>
      </Box>

      {/* 업로드 진행률 */}
      {isUploading[section] && (
        <Box mb={4} p={3} bg="gray.50" borderRadius="8px">
          <VStack spacing={2}>
            <HStack w="full" justify="space-between">
              <Text fontSize="sm" fontWeight="bold">
                업로드 중...
              </Text>
              <Text fontSize="sm" color="gray.600">
                {uploadProgress[section]}%
              </Text>
            </HStack>
            <Progress
              value={uploadProgress[section]}
              size="sm"
              colorScheme="purple"
              w="full"
              borderRadius="full"
              hasStripe
              isAnimated
            />
          </VStack>
        </Box>
      )}

      {/* 업로드된 파일 목록 */}
      <Box flex="1">
        <HStack justify="space-between" mb={3}>
          <Heading size="xs">업로드된 파일</Heading>
          <Badge colorScheme="purple" fontSize="xs">
            {fileList.length}개
          </Badge>
        </HStack>

        {fileList.length === 0 ? (
          <Box
            textAlign="center"
            py={6}
            color="gray.500"
            bg="gray.50"
            borderRadius="8px"
          >
            <Text fontSize="sm">업로드된 파일이 없습니다</Text>
          </Box>
        ) : (
          <Box maxH="300px" overflowY="auto" pr={2}>
            <List spacing={2}>
              {fileList.map((file) => (
                <ListItem key={file.id}>
                  <HStack
                    p={3}
                    bg="gray.50"
                    borderRadius="8px"
                    justify="space-between"
                    _hover={{ bg: "gray.100" }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={2} flex="1" minW="0">
                      <Icon
                        as={FiFile}
                        boxSize={4}
                        color="primary.500"
                        flexShrink="0"
                      />
                      <VStack align="start" spacing={0} flex="1" minW="0">
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          noOfLines={1}
                          w="full"
                        >
                          {file.name}
                        </Text>
                        <HStack fontSize="xs" color="gray.600">
                          <Badge colorScheme="purple" fontSize="xs">
                            {file.type}
                          </Badge>
                          <Text fontSize="xs">{file.size}</Text>
                        </HStack>
                      </VStack>
                      {file.status === "completed" && (
                        <Icon
                          as={FiCheckCircle}
                          color="green.500"
                          boxSize={4}
                          flexShrink="0"
                        />
                      )}
                    </HStack>

                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(file.id, section)}
                      flexShrink="0"
                    >
                      삭제
                    </Button>
                  </HStack>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Card>
  );

  return (
    <Box>
      <Heading size="xl" mb={6}>
        📤 RAG 데이터 업로드
      </Heading>

      {/* 3개 업로드 섹션 (가로 분할) */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4} mb={6}>
        <UploadSection
          title="이음AI 회의록"
          description="이음에서 자동 생성된 회의록을 업로드하세요"
          bgGradient="linear-gradient(135deg, #4811BF 0%, #8C5CF2 100%)"
          fileList={ieumFiles}
          section="ieum"
          acceptedFormats=".pdf,.docx,.doc"
        />

        <UploadSection
          title="RAG Custom 회의록"
          description="회사 양식에 맞춘 커스텀 회의록 템플릿을 업로드하세요"
          bgGradient="linear-gradient(135deg, #8C5CF2 0%, #B794F6 100%)"
          fileList={customFiles}
          section="custom"
          acceptedFormats=".pdf,.docx,.doc"
        />

        <UploadSection
          title="외부자료"
          description="회의 인사이트 도출에 필요한 참고 자료를 업로드하세요"
          bgGradient="linear-gradient(135deg, #09A603 0%, #38B2AC 100%)"
          fileList={externalFiles}
          section="external"
          acceptedFormats=".pdf,.docx,.doc,.ppt,.pptx,.jpg,.jpeg,.png"
        />
      </SimpleGrid>

      {/* 안내 사항 */}
      <Card bg="blue.50">
        <VStack align="start" spacing={2}>
          <Heading size="sm" color="blue.700">
            💡 RAG 시스템 안내
          </Heading>
          <Text fontSize="sm" color="blue.700" lineHeight="1.8">
            • <strong>이음AI 회의록</strong>: 이음에서 자동 생성된 회의록 파일
            (PDF, DOCX | 최대 100MB)
            <br />• <strong>RAG Custom 회의록</strong>: 회사 전용 회의록 양식
            템플릿 (PDF, DOCX | 최대 100MB)
            <br />• <strong>외부자료</strong>: 마케팅 자료, 리서치 문서 등 회의
            인사이트 도출에 필요한 모든 자료 (PDF, DOCX, PPT, 이미지 | 최대
            100MB)
            <br />• <strong>파일 크기 제한</strong>: 각 파일은 최대 100MB까지
            업로드 가능합니다
            <br />
            • 업로드된 파일은 벡터 데이터베이스에 저장되며, 회의 중 AI가
            자동으로 관련 내용을 찾아드립니다
            <br />• 보안을 위해 암호화되어 저장되며, 프로젝트 종료 후 6개월 뒤
            자동 삭제됩니다
          </Text>
        </VStack>
      </Card>
    </Box>
  );
}

export default Upload;
