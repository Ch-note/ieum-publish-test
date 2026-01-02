import React from 'react'
import { Box } from '@chakra-ui/react'

function Card({ children, ...props }) {
  return (
    <Box
      bg="white"
      borderRadius="16px"
      p={6}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.100"
      {...props}
    >
      {children}
    </Box>
  )
}

export default Card
