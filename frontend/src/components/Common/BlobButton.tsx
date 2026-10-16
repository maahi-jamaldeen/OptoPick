import React from 'react';

export interface BlobButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'prism';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
}

export const BlobButton: React.FC<BlobButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const classes = [
    'blob-btn',
    variant === 'prism' ? 'a' : '',
    size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : '',
    block ? 'block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled} style={style} {...props}>
      <span style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {children}
      </span>
      <span className="blob-btn__inner" aria-hidden="true">
        <span className="blob-btn__blobs">
          <span className="blob-btn__blob"></span>
          <span className="blob-btn__blob"></span>
          <span className="blob-btn__blob"></span>
          <span className="blob-btn__blob"></span>
        </span>
      </span>
    </button>
  );
};
