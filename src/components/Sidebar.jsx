import React from "react";
import { Box, VStack, Button } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiMic,
  FiFileText,
  FiSettings,
  FiUpload,
} from "react-icons/fi";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "홈", icon: FiHome, path: "/home" },
    { label: "회의", icon: FiMic, path: "/meeting" },
    { label: "인사이트", icon: FiFileText, path: "/result/999" },
    { label: "업로드", icon: FiUpload, path: "/upload" },
    { label: "설정", icon: FiSettings, path: "/settings" },
  ];

  return (
    <Box
      w="200px"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      p={4}
    >
      <VStack spacing={2} align="stretch">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            leftIcon={<item.icon />}
            variant={location.pathname === item.path ? "solid" : "ghost"}
            colorScheme={location.pathname === item.path ? "purple" : "gray"}
            justifyContent="flex-start"
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </Button>
        ))}
      </VStack>
    </Box>
  );
}

export default Sidebar;
