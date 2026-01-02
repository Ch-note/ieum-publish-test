import React from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

function Login() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAppContext();

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate("/home");
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="linear-gradient(135deg, #4811BF 0%, #8C5CF2 100%)"
    >
      <Box
        bg="white"
        p={10}
        borderRadius="20px"
        boxShadow="2xl"
        w="450px"
        textAlign="center"
      >
        <Image
          src="/logo-main.svg" // 로컬 SVG 파일 사용
          alt="이음 로고"
          h="100px" // 크기 증가
          mx="auto"
          mb={6}
          objectFit="contain"
          fallback={
            // 로고 로드 실패 시 대체
            <Heading size="2xl" mb={4} color="primary.500">
              ∞ 이음
            </Heading>
          }
        />
        <Text fontSize="lg" color="gray.600" mb={8}>
          말과 행동을 잇는 가장 쉬운 방법
        </Text>

        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>이메일</FormLabel>
            <Input
              type="email"
              placeholder="example@company.com"
              size="lg"
              defaultValue="demo@ieum.ai"
            />
          </FormControl>

          <FormControl>
            <FormLabel>비밀번호</FormLabel>
            <Input
              type="password"
              placeholder="••••••••"
              size="lg"
              defaultValue="demo1234"
            />
          </FormControl>

          <Button
            colorScheme="purple"
            size="lg"
            mt={4}
            onClick={handleLogin}
            bgGradient="linear(to-r, primary.500, secondary.500)"
            _hover={{
              bgGradient: "linear(to-r, primary.600, secondary.600)",
            }}
          >
            로그인
          </Button>
        </VStack>

        <Text fontSize="sm" color="gray.500" mt={6}>
          © 2025 이음 (Ieum) - All rights reserved
        </Text>
      </Box>
    </Flex>
  );
}

export default Login;
