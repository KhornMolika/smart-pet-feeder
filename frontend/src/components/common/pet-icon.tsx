import React from 'react';
import {
  Cat,
  Dog,
  Rabbit,
  Bird,
  PawPrint,
  Fish,
  Turtle,
  Bone,
  Cookie,
  Soup,
  Beef,
  Crown,
  Sparkles,
  Trophy,
  Utensils,
} from 'lucide-react';

interface PetIconProps {
  icon?: string;
  size?: number;
  className?: string;
}

export function PetIcon({ icon, size = 18, className = '' }: PetIconProps) {
  switch (icon?.toLowerCase()) {
    case 'cat':
    case '🐱':
      return <Cat size={size} className={className} />;
    case 'dog':
    case '🐶':
      return <Dog size={size} className={className} />;
    case 'rabbit':
    case 'bunny':
    case '🐰':
      return <Rabbit size={size} className={className} />;
    case 'bird':
    case 'parrot':
    case '🦜':
      return <Bird size={size} className={className} />;
    case 'fish':
    case '🐟':
      return <Fish size={size} className={className} />;
    case 'turtle':
    case '🐢':
      return <Turtle size={size} className={className} />;
    case 'bone':
    case '🦴':
      return <Bone size={size} className={className} />;
    case 'paw':
    case '🐾':
    default:
      return <PawPrint size={size} className={className} />;
  }
}

interface PresetIconProps {
  icon?: string;
  size?: number;
  className?: string;
}

export function PresetIcon({ icon, size = 20, className = '' }: PresetIconProps) {
  switch (icon?.toLowerCase()) {
    // 1. Light Snack / Treat / Biscuit / Bone
    case 'cookie':
    case 'biscuit':
    case 'snack':
    case 'treat':
    case '🍪':
      return <Cookie size={size} className={className} />;
    case 'bone':
    case '🦴':
      return <Bone size={size} className={className} />;
    case 'fish':
    case '🐟':
      return <Fish size={size} className={className} />;

    // 2. Regular Bowl / Meal / Portion
    case 'bowl':
    case 'soup':
    case 'dish':
    case 'meal':
    case '🥣':
      return <Soup size={size} className={className} />;
    case 'beef':
    case 'meat':
    case 'steak':
    case '🍖':
      return <Beef size={size} className={className} />;
    case 'utensils':
      return <Utensils size={size} className={className} />;

    // 3. Royal Feast / Hearty / Special
    case 'crown':
    case 'feast':
    case 'royal':
    case '👑':
      return <Crown size={size} className={className} />;
    case 'sparkles':
    case 'star':
    case '✨':
      return <Sparkles size={size} className={className} />;
    case 'trophy':
    case 'award':
    case '🏆':
      return <Trophy size={size} className={className} />;

    default:
      return <Sparkles size={size} className={className} />;
  }
}

