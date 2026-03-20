import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: var(--fontXs);
    color: var(--font);
    ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }    
  }
  :root {
    /* 색상 정의 */
    --main : #2C3BA1;
    --main2 : #c8cce6;
    --background : #FFFFFF;
    --background2 : #f8fafc;
    --border : #E9E9E9;
    --font : #000000;
    --font2 : #828282;
    --font3 : #ffffff;
    --run : #009B57; 
    --waiting : #F76C0F; 
    --error : #EF4444; 
    --bgRun : #e9f3ee;
    --bgWaiting : #FEF6E7;
    --bgError : #FEEDED;

    /* 박스 그림자 */
    --shadow : 5px 3px 6px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.15);

    /* 폰트 사이즈 정의 */
    --fontMini : 9px;  /* 아주 작은 텍스트 (캡션, 라벨) */
    --fontXxs : 11px;  /* 아주 작은 텍스트 (캡션, 라벨) */
    --fontXs : 12px;  /* 아주 작은 텍스트 (캡션, 라벨) */
    --fontSm : 14px;  /* 작은 텍스트 (보조 설명) */
    --fontMd : 15px;  /* 본문 기본 텍스트 (일반적인 크기) */
    --fontLg : 16px;  /* 강조된 본문, 소제목 */
    --fontHd : 18px;  /* 카드 타이틀, 중간 제목 */
    --fontXl : 18px;  /* 카드 타이틀, 중간 제목 */
    --font2xl : 20px;  /* 대제목 */
    --fontTitle : 20px;  /* 화면 타이틀 */

    /* 폰트 굵기 정의 */
    --normal : 400;
    --medium : 500;
    --bold : 600;
    --titleBold : 700;
  }
  button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer; 
    font-family: inherit;
  }
  input, textarea {
    outline: none; 
    border: none;
    font-family: inherit; 
    font-size: inherit
  }
  a {
    text-decoration: none;
    color: inherit;   
  }
  ul, li {
    list-style: none;  
  }
  img {
    max-width: 100%;
    display: block;  
  }
  svg:focus {
  outline: none; 
  }

  svg *:focus {
  outline: none; 
  }
`;

export default GlobalStyle;
