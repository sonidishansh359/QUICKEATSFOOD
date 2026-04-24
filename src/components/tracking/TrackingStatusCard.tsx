import React from 'react';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrackingStatusCardProps {
  deliveryBoyName: string;
  deliveryBoyPhone?: string;
  vehicleType: string;
  vehicleNumber: string;
  eta: number;
  distance: number;
  speed: number;
  isTracking: boolean;
}

export const TrackingStatusCard: React.FC<TrackingStatusCardProps> = ({
  deliveryBoyName,
  deliveryBoyPhone,
  vehicleType,
  vehicleNumber,
  eta,
  distance,
  speed,
  isTracking
}) => {
  // Calculate progress percentage (0-100)
  // Assume max ETA is 45 mins for full progress bar
  const maxEta = 45;
  const progress = Math.min(((maxEta - eta) / maxEta) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            🏍️
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{deliveryBoyName}</h2>
            <p className="text-sm text-gray-500">{vehicleType} • {vehicleNumber}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${
          isTracking
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
          {isTracking ? 'On the way' : 'Waiting'}
        </div>
      </div>

      {/* ETA Section */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-orange-600">{eta}</span>
          <span className="text-lg text-gray-600">mins</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">Estimated arrival time</p>
        
        {/* Progress Bar */}
        <div className="w-full h-3 bg-orange-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Distance & Speed */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-600 font-medium">DISTANCE</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{distance.toFixed(2)} km</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <p className="text-xs text-gray-600 font-medium">SPEED</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{Math.round(speed * 3.6)} km/h</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {deliveryBoyPhone && (
          <Button
            onClick={() => window.location.href = `tel:${deliveryBoyPhone}`}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Phone size={18} />
            Call
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 gap-2"
        >
          <MessageCircle size={18} />
          Message
        </Button>
      </div>

      {/* Your Location */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start gap-2">
        <MapPin size={18} className="text-gray-600 mt-1 flex-shrink-0" />
        <div>
          <p className="text-xs text-gray-600 font-medium">DELIVERY ADDRESS</p>
          <p className="text-sm text-gray-800 font-medium mt-1">Your location</p>
        </div>
      </div>
    </div>
  );
};
