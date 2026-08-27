import React from 'react';
import { Plus } from 'lucide-react';

const ProductCard = ({ product, onAdd }) => {
  const formatRupee = (num) => {
    return '₹' + Number(num).toLocaleString('en-IN');
  };

  return (
    <div className="glass-panel product-card-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        {product.image && (
          <div className="product-image-container" style={{ 
            width: '100%', 
            aspectRatio: '1 / 1', 
            borderRadius: 'var(--radius-sm)', 
            overflow: 'hidden', 
            marginBottom: '16px',
            border: '1px solid var(--border-color)',
            background: '#faf9f6'
          }}>
            <img 
              src={product.image} 
              alt={product.name} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: product.imageFit || 'cover',
                objectPosition: product.imagePosition || 'center center',
                display: 'block'
              }} 
            />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {product.name}
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, marginBottom: '20px' }}>
          {product.desc}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <span className="font-mono" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {formatRupee(product.price)}
        </span>
        <button 
          onClick={() => onAdd(product)} 
          className="btn btn-secondary" 
          style={{ padding: '8px 16px', fontSize: '12.5px' }}
        >
          <Plus size={14} />
          Add to Hoop
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
