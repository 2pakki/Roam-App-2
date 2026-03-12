import React from 'react';
import { Calendar, Clock, MapPin, Tag, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventProps {
  event: {
    _id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    price: string;
    description: string;
    category: string;
    sourceUrl: string;
    imageUrl: string;
  };
}

export const EventCard: React.FC<EventProps> = ({ event }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(event.title)}/800/600`;
          }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-zinc-800 shadow-sm">
          {event.category}
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-semibold text-zinc-900 mb-2 leading-tight">{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-zinc-600 text-sm">
            <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center text-zinc-600 text-sm">
            <Clock className="w-4 h-4 mr-2 text-indigo-500" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center text-zinc-600 text-sm">
            <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-zinc-600 text-sm">
            <Tag className="w-4 h-4 mr-2 text-indigo-500" />
            <span>{event.price}</span>
          </div>
        </div>
        
        <p className="text-zinc-600 text-sm mb-5 line-clamp-2">{event.description}</p>
        
        <a 
          href={event.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          View Source <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </div>
    </motion.div>
  );
};
