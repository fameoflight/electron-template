import React from 'react';
import { Result, Button, Space } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Result
          status="404"
          title={
            <div className="flex items-center justify-center">
              <span className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                404
              </span>
            </div>
          }
          subTitle={
            <div className="text-center mt-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                Oops! Page Not Found
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                The page you're looking for seems to have vanished into the digital void.
                Don't worry, even the best explorers get lost sometimes!
              </p>
            </div>
          }
          extra={
            <div className="mt-8">
              <Space size="middle" wrap>
                <Button
                  type="default"
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleGoBack}
                  className="h-12 px-6 rounded-lg border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                >
                  Go Back
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={handleGoHome}
                  className="h-12 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go Home
                </Button>
              </Space>
            </div>
          }
          className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
        />

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            If you believe this is an error, please contact our support team or
            try using the navigation menu to find what you're looking for.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;