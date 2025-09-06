import React from 'react';
import { Text as pixiText, TextStyle, Color, Container } from 'pixi.js';
import { extend } from '@pixi/react';
import { useFontLoading } from '@/hooks/use-font-loading';
import type { AnimatedCanvasObject } from '@/types/canvas';

// Extend PIXI components for React
extend({ Text: pixiText, Container });

// Simple Monaco-like colors for syntax highlighting
const MONACO_COLORS = {
  dark: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    keywords: '#569cd6',
    strings: '#ce9178',
    comments: '#6a9955',
    numbers: '#b5cea8',
    operators: '#d4d4d4',
    functions: '#dcdcaa',
    types: '#4ec9b0'
  },
  light: {
    background: '#ffffff',
    foreground: '#000000',
    keywords: '#0000ff',
    strings: '#a31515',
    comments: '#008000',
    numbers: '#098658',
    operators: '#000000',
    functions: '#795e26',
    types: '#267f99'
  }
};

// Simple syntax highlighting function
const highlightCode = (code: string, language: string = 'javascript', theme: 'dark' | 'light' = 'dark') => {
  const colors = MONACO_COLORS[theme];
  const tokens: Array<{ text: string; color: string }> = [];
  
  // Simple regex-based tokenization for JavaScript
  const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|default|async|await|try|catch|finally|switch|case|break|continue|true|false|null|undefined|this|super|new|delete|typeof|instanceof|in|of|void|yield|static|public|private|protected|extends|implements|interface|type|enum|namespace|module|require|console|log|warn|error|info|debug)\b/g;
  const strings = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const numbers = /\b\d+(?:\.\d+)?\b/g;
  const functions = /\b\w+(?=\s*\()/g;
  
  let lastIndex = 0;
  let text = code;
  
  // Find all matches and sort by position
  const matches: Array<{ type: string; match: string; index: number; color: string }> = [];
  
  // Keywords
  let match: RegExpExecArray | null;
  while ((match = keywords.exec(text)) !== null) {
    matches.push({ type: 'keyword', match: match[0], index: match.index, color: colors.keywords });
  }
  
  // Strings
  while ((match = strings.exec(text)) !== null) {
    matches.push({ type: 'string', match: match[0], index: match.index, color: colors.strings });
  }
  
  // Comments
  while ((match = comments.exec(text)) !== null) {
    matches.push({ type: 'comment', match: match[0], index: match.index, color: colors.comments });
  }
  
  // Numbers
  while ((match = numbers.exec(text)) !== null) {
    matches.push({ type: 'number', match: match[0], index: match.index, color: colors.numbers });
  }
  
  // Functions
  while ((match = functions.exec(text)) !== null) {
    // Skip if it's already matched as a keyword
    if (!matches.some(m => m.index === match!.index && m.match === match![0])) {
      matches.push({ type: 'function', match: match![0], index: match!.index, color: colors.functions });
    }
  }
  
  // Sort matches by position
  matches.sort((a, b) => a.index - b.index);
  
  // Build tokens
  for (const match of matches) {
    // Add text before this match
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index), color: colors.foreground });
    }
    
    // Add the matched token
    tokens.push({ text: match.match, color: match.color });
    lastIndex = match.index + match.match.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), color: colors.foreground });
  }
  
  return { tokens, theme };
};

interface CodeEditorRendererProps {
  element: AnimatedCanvasObject;
  isEditing?: boolean;
}

export const CodeEditorRenderer: React.FC<CodeEditorRendererProps> = ({ element, isEditing = false }) => {
  const { fontsLoaded } = useFontLoading();

  if (!fontsLoaded) {
    return null;
  }

  if (element.type !== 'code-editor' || !element.text) {
    return null;
  }

  // Split text into lines
  const lines = element.text.split('\n');
  const lineHeight = (element.fontSize || 14) * 1.5;
  const lineNumberWidth = element.showLineNumbers ? 60 : 0;
  const codeStartX = -element.width / 2 + lineNumberWidth;

  return (
    <pixiContainer>
      {/* Line numbers */}
      {element.showLineNumbers && (
        <pixiContainer>
          {lines.map((_, index) => (
            <pixiText
              key={`line-${index}`}
              text={(index + 1).toString().padStart(3, ' ')}
              style={new TextStyle({
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: element.fontSize || 14,
                fontWeight: '400',
                fontStyle: 'normal',
                fill: '#666666', // Dark gray for visibility on white background
              })}
              anchor={{ x: 0, y: 0.5 }}
              x={-element.width / 2 + 10}
              y={-element.height / 2 + index * lineHeight + lineHeight / 2}
              interactive={false}
              eventMode="none"
            />
          ))}
        </pixiContainer>
      )}

      {/* Code lines with syntax highlighting */}
      <pixiContainer>
        {lines.map((line, lineIndex) => {
          // Apply syntax highlighting to each line
          const syntaxResult = highlightCode(
            line,
            element.language || 'javascript',
            'light' // Use light theme for white background
          );

          // Calculate total width of tokens for centering
          const totalWidth = syntaxResult.tokens.reduce((width, token) => {
            return width + (token.text.length * (element.fontSize || 14) * 0.6);
          }, 0);

          return (
            <pixiContainer key={`code-line-${lineIndex}`}>
              {syntaxResult.tokens.map((token, tokenIndex) => {
                // Calculate x position for each token
                const previousTokensWidth = syntaxResult.tokens.slice(0, tokenIndex).reduce((sum, t) => 
                  sum + (t.text.length * (element.fontSize || 14) * 0.6), 0
                );
                const x = codeStartX + previousTokensWidth;

                return (
                  <pixiText
                    key={`token-${lineIndex}-${tokenIndex}`}
                    text={token.text}
                    style={new TextStyle({
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: element.fontSize || 14,
                      fontWeight: '400',
                      fontStyle: 'normal',
                      fill: token.color,
                      wordWrap: true,
                      wordWrapWidth: element.width - lineNumberWidth,
                      lineHeight: 1.5,
                    })}
                    anchor={{ x: 0, y: 0.5 }}
                    x={x}
                    y={-element.height / 2 + lineIndex * lineHeight + lineHeight / 2}
                    interactive={!isEditing}
                    eventMode={!isEditing ? 'dynamic' : 'none'}
                  />
                );
              })}
            </pixiContainer>
          );
        })}
      </pixiContainer>
    </pixiContainer>
  );
};
