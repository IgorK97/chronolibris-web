import { Spoiler } from './Spoiler';

export const renderFormattedText = (text: string) => {
  const regex = /(\*\*.*?\*\*|~~.*?~~|_.*?_|>!.*?!<)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={index}>{part.slice(2, -2)}</del>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('>!') && part.endsWith('!<')) {
      return <Spoiler key={index}>{part.slice(2, -2)}</Spoiler>;
    }
    return part;
  });
};
