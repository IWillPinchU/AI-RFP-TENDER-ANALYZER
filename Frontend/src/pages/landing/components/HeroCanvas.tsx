export function HeroCanvas() {
  return (
    <iframe 
      src="/animhero.html" 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 0, 
        border: 'none',
        pointerEvents: 'auto'
      }} 
      title="Wayne AI Hero Animation"
    />
  );
}
