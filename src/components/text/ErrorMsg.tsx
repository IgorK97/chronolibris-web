export const ErrorMsg = ({ text }: { text?: string }) =>
  text ? (
    <span style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
      {text}
    </span>
  ) : null;
