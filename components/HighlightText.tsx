import React, { useMemo } from 'react';

interface HighlightTextProps {
  text: string;
  highlight: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, highlight }) => {
  const parts = useMemo(() => {
    if (!highlight.trim()) {
      return [{ text, isMatch: false }];
    }

    // Escape basic regex characters
    const escapedHighlight = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a pattern that matches accented characters for each vowel in the search term
    // This allows "oracao" to match "oração" visually
    const patternString = escapedHighlight
      .replace(/[aáàâã]/gi, '[aáàâãAÁÀÂÃ]')
      .replace(/[eéèê]/gi, '[eéèêEÉÈÊ]')
      .replace(/[iíìî]/gi, '[iíìîIÍÌÎ]')
      .replace(/[oóòôõ]/gi, '[oóòôõOÓÒÔÕ]')
      .replace(/[uúùû]/gi, '[uúùûUÚÙÛ]')
      .replace(/[cç]/gi, '[cçCÇ]');

    const regex = new RegExp(`(${patternString})`, 'gi');
    const rawParts = text.split(regex);
    
    return rawParts.map(part => ({
      text: part,
      isMatch: regex.test(part)
    }));
  }, [text, highlight]);

  return (
    <span>
      {parts.map((part, i) => 
        part.isMatch ? (
          <span key={i} className="bg-amber-200 text-amber-900 dark:bg-amber-600 dark:text-white rounded px-0.5 font-medium">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
};