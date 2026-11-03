import './Logo.css';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className={`logo logo--${size}`} aria-hidden="true">
      С
    </span>
  );
}
