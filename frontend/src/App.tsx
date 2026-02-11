import { Route, Routes, Navigate } from 'react-router-dom';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { ChatPage } from './features/chat/ChatPage';
import { ProfileSettings } from './features/settings/ProfileSettings';
import { AccountSettings } from './features/settings/AccountSettings';
import { Box, Flex, Heading, Link, Stack } from '@chakra-ui/react';
import { useAuth } from './hooks/useAuth';
import { Link as RouterLink } from 'react-router-dom';

const SettingsPage = () => {
  return (
    <Flex minH="100vh" px={8} py={10} direction={{ base: 'column', lg: 'row' }} gap={10}>
      <Box w={{ base: '100%', lg: '40%' }}>
        <Heading size="lg" color="brand.100">
          Settings
        </Heading>
      </Box>
      <Stack spacing={10} w={{ base: '100%', lg: '60%' }}>
        <ProfileSettings />
        <AccountSettings />
      </Stack>
    </Flex>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App = () => {
  return (
    <Box minH="100vh">
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
      <Link
        as={RouterLink}
        to="/settings"
        position="fixed"
        bottom="24px"
        right="24px"
        bg="rgba(15, 23, 42, 0.8)"
        px={4}
        py={2}
        borderRadius="full"
        color="brand.100"
      >
        Settings
      </Link>
    </Box>
  );
};
