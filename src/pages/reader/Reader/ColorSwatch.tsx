export const ColorSwatch: React.FC<{
  color: string;
  selected: boolean;
  onSelect: () => void;
  dark?: boolean;
}> = ({ color, selected, onSelect, dark }) => (
  <button
    onClick={onSelect}
    title={color}
    style={{
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: color,
      border: selected
        ? `3px solid ${dark ? '#fff' : '#1a1a1a'}`
        : '2px solid #ccc',
      outline: selected ? `2px solid ${color}` : 'none',
      outlineOffset: 2,
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
      transition: 'transform 0.1s',
      transform: selected ? 'scale(1.18)' : 'scale(1)',
      boxShadow: selected
        ? '0 0 0 2px rgb(0 0 0 / 18%)'
        : '0 1px 3px rgb(0 0 0 / 12%)',
    }}
  />
);
