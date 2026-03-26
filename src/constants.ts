import { Book } from "./types";

export const BOOKS: Book[] = [
  {
    id: '1',
    title: '심청전',
    author: '작자 미상',
    cover: 'https://picsum.photos/seed/simcheong/300/400',
    file: './books/simcheong.txt',
    type: 'txt',
    progress: 45,
    isLocked: false,
  },
  {
    id: '2',
    title: '춘향전',
    author: '작자 미상',
    cover: 'https://picsum.photos/seed/chunhyang/300/400',
    file: './books/chunhyang.epub',
    type: 'epub',
    progress: 10,
    isLocked: true,
  },
  {
    id: '3',
    title: '홍길동전',
    author: '허균',
    cover: 'https://picsum.photos/seed/honggildong/300/400',
    file: './books/honggildong.txt',
    type: 'txt',
    progress: 0,
    isLocked: true,
  },
  {
    id: '4',
    title: '토끼전',
    author: '작자 미상',
    cover: 'https://picsum.photos/seed/rabbit/300/400',
    file: './books/rabbit.txt',
    type: 'txt',
    progress: 0,
    isLocked: true,
  },
  {
    id: '5',
    title: '박씨전',
    author: '작자 미상',
    cover: 'https://picsum.photos/seed/park/300/400',
    file: './books/park.txt',
    type: 'txt',
    progress: 0,
    isLocked: true,
  }
];

export const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwzhq9uKJ5ZJ9nfukU831Vx--ztY0d9xQbnAta5bNti091O4DY-J989sWt4szHgNlzK/exec";
