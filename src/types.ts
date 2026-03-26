export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  file: string; // path to .txt or .epub
  type: 'txt' | 'epub';
  progress: number;
  isLocked: boolean;
}

export interface User {
  name: string;
  role: 'student' | 'admin';
}

export interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface AdminConfig {
  todayBookId: string;
  startRange: number;
  endRange: number;
}
