import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Fab,
  Collapse,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { config } from '@/constants/config';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const Chatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'こんにちは！Databricks Chatbotです。データに関する質問があればお気軽にどうぞ。',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // モックモードまたは実際のAPI呼び出し
      const response = await sendMessageToChatbot(input);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* チャットボタン */}
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* チャットウィンドウ */}
      <Collapse in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            width: 380,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
          }}
        >
          {/* ヘッダー */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BotIcon />
              <Typography variant="h6">Databricks Chatbot</Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* メッセージエリア */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              backgroundColor: 'grey.50',
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    maxWidth: '80%',
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                    }}
                  >
                    {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                  </Avatar>
                  <Paper
                    sx={{
                      p: 1.5,
                      backgroundColor: message.sender === 'user' ? 'primary.light' : 'white',
                      color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Avatar sx={{ width: 32, height: 32, backgroundColor: 'secondary.main' }}>
                    <BotIcon />
                  </Avatar>
                  <Paper sx={{ p: 1.5 }}>
                    <CircularProgress size={20} />
                  </Paper>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* 入力エリア */}
          <Box sx={{ p: 2, backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="メッセージを入力..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || loading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

/**
 * Chatbotにメッセージを送信
 */
async function sendMessageToChatbot(message: string): Promise<string> {
  // モックモードの場合
  if (config.mockMode) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return generateMockResponse(message);
  }

  // 実際のDatabricks Genie APIまたは類似のサービスを呼び出す
  // TODO: 実際のAPI実装
  try {
    // const response = await fetch('/api/chatbot', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message }),
    // });
    // const data = await response.json();
    // return data.response;

    // 現在はモックレスポンスを返す
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return generateMockResponse(message);
  } catch (error) {
    throw new Error('Chatbotとの通信に失敗しました');
  }
}

/**
 * モックレスポンスを生成
 */
function generateMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('クラスター') || lowerMessage.includes('cluster')) {
    return 'クラスターに関する情報ですね。現在、3つのクラスターが稼働中です。詳細はクラスター管理ページでご確認いただけます。';
  }

  if (lowerMessage.includes('ジョブ') || lowerMessage.includes('job')) {
    return 'ジョブに関するご質問ですね。現在、3つのジョブが登録されており、そのうち1つが実行中です。ジョブ管理ページで詳細をご確認ください。';
  }

  if (lowerMessage.includes('データ') || lowerMessage.includes('テーブル') || lowerMessage.includes('data') || lowerMessage.includes('table')) {
    return 'データに関するご質問ですね。データ管理ページでデータベースとテーブルを閲覧できます。SQLクエリエディターも利用可能です。';
  }

  if (lowerMessage.includes('ノートブック') || lowerMessage.includes('notebook')) {
    return 'ノートブックに関するご質問ですね。ノートブック管理ページでノートブックの閲覧と実行が可能です。';
  }

  if (lowerMessage.includes('ヘルプ') || lowerMessage.includes('help') || lowerMessage.includes('使い方')) {
    return '以下の機能をご利用いただけます：\n\n• クラスター管理：クラスターの表示と操作\n• ノートブック管理：ノートブックの閲覧と実行\n• データ管理：データベース/テーブルの閲覧とSQLクエリ実行\n• ジョブ管理：ジョブの監視と実行\n\n具体的な質問があればお気軽にどうぞ！';
  }

  return 'ご質問ありがとうございます。より具体的な情報を提供するため、以下のような質問をお試しください：\n\n• 「クラスターの状態を教えて」\n• 「実行中のジョブは？」\n• 「データベース一覧を見たい」\n• 「ノートブックの使い方は？」';
}
