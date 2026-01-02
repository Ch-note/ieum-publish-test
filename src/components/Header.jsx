import React from "react";
import {
  Flex,
  Heading,
  Button,
  Avatar,
  HStack,
  Text,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

function Header() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAppContext();

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <Flex
      as="header"
      h="70px"
      bg="white"
      px={8}
      alignItems="center"
      justifyContent="space-between"
      borderBottom="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <Image
        src="/logo-main.svg"
        alt="이음 로고"
        h="40px" // 헤더용 작은 크기
        objectFit="contain"
        cursor="pointer"
        onClick={() => navigate("/home")} // 클릭 시 홈으로 이동
        fallback={
          <Heading size="lg" color="primary.500" fontWeight="bold">
            ∞ 이음
          </Heading>
        }
      />

      <HStack spacing={4}>
        <Text fontSize="sm" color="gray.600">
          카리나 님
        </Text>
        <Avatar size="sm" name="카리나" bg="secondary.500" />
        <Button size="sm" variant="ghost" onClick={handleLogout}>
          로그아웃
        </Button>
      </HStack>
    </Flex>
  );
}

export default Header;
