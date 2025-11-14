import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, Suspense } from 'react';
import { message } from 'antd';
import { graphql, RelayEnvironmentProvider } from 'react-relay';
import { createEnvironment, fetchQuery } from '@ui/relay/environment';
import { AuthRelayProviderMutation } from './__generated__/AuthRelayProviderMutation.graphql';

interface User {
  id: string;
  name: string;
  username: string;
  sessionKey?: string | null;
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthRelayProvider');
  }
  return context;
};

interface AuthRelayProviderProps {
  children: ReactNode;
}

const fetchSessionMutation = graphql`
  mutation AuthRelayProviderMutation($sessionKey: String!){
    validateSessionKey(sessionKey: $sessionKey) {
      id
      name
      username
      sessionKey
    }
  }
`;

export const AuthRelayProvider: React.FC<AuthRelayProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const environment = useMemo(() => {
    return createEnvironment(user?.sessionKey);
  }, [user?.sessionKey]);


  const refreshCurrentUser = async () => {
    const sessionKey = localStorage.getItem('sessionKey');
    if (!sessionKey) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const resp = await fetchQuery<AuthRelayProviderMutation>(fetchSessionMutation, { sessionKey })

      if (resp?.data?.validateSessionKey) {
        const userData = resp?.data?.validateSessionKey;
        setUser(userData);
      } else {
        setUser(null);
        localStorage.removeItem('sessionKey');
      }
    } catch (error) {
      setUser(null);
      localStorage.removeItem('sessionKey');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCurrentUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    if (userData.sessionKey) {
      localStorage.setItem('sessionKey', userData.sessionKey);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sessionKey');
    message.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshCurrentUser,
  };

  const Provider = RelayEnvironmentProvider as any;

  return (
    <Provider environment={environment}>
      <AuthContext.Provider value={value}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </AuthContext.Provider>
    </Provider>
  );
};