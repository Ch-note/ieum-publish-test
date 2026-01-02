import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import Header from './Header'
import Sidebar from './Sidebar'

function AppLayout({ children }) {
  return (
    <Flex h="100vh" bg="bg.50">
      <Sidebar />
      <Flex direction="column" flex="1">
        <Header />
        <Box flex="1" p={6} overflow="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}

export default AppLayout
