import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import App from './App'

// 이음 디자인 시스템 테마
const theme = extendTheme({
  colors: {
    primary: {
      500: '#4811BF',
      600: '#3A0D99',
    },
    secondary: {
      500: '#8C5CF2',
      600: '#7449CC',
    },
    success: {
      500: '#09A603',
      600: '#078502',
    },
    bg: {
      50: '#F2F2F2',
      100: '#E8E8E8',
    },
  },
  fonts: {
    heading: 'Pretendard, -apple-system, sans-serif',
    body: 'Pretendard, -apple-system, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'bg.50',
        color: 'gray.800',
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
