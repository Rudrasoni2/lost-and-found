// src/components/ItemCard.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, User } from 'lucide-react';
import { format } from 'date-fns';
import { getImageUrl } from '../services/api';

/**
 * ItemCard component with premium theme and 3D tilt effect.
 * Applies new Tailwind color palette and hover animations.
 */
export default function ItemCard({ item }) {
  // 3D tilt effect state (desktop only)
  const [tiltStyle, setTiltStyle] = useState({});
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 5; // max 5deg
    const rotateX = ((midY - y) / midY) * 5;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)', transition: 'transform 0.3s' });
  };

  return (
    <Link
      to={`/items/${item.id}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="block bg-cardWhite rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-secondaryText group hover:scale-[1.02] animate-fade-up"
      style={tiltStyle}
    >
      <div className="relative h-48 bg-softBg overflow-hidden">
        {item.images && item.images.length > 0 ? (
          <img
            src={getImageUrl(item.images[0].file_path)}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-softBg to-cardWhite"></div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {item.status === 'recovered' ? (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-electricCyan text-white shadow-sm">
              Recovered
            </span>
          ) : (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded shadow-sm ${item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
            >
              {item.type === 'lost' ? 'Lost' : 'Found'}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-mainText truncate mb-2">{item.name}</h3>
        <div className="space-y-1 text-sm text-secondaryText">
          <p className="flex items-center gap-2">
            <Tag className="w-4 h-4" /> {item.category}
          </p>
          <p className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{item.location}</span>
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />{' '}
            {item.date_lost_found ? format(new Date(item.date_lost_found), 'MMM d, yyyy') : 'Unknown'}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-secondaryText mt-2">
            <p className="flex items-center gap-2 text-xs">
              <User className="w-3 h-3" /> {item.user_name || 'Anonymous'}
            </p>
            {item.color && (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className="w-3 h-3 rounded-full border border-secondaryText"
                  style={{ backgroundColor: item.color }}
                  title={item.color}
                ></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
