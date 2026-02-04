import React from 'react';
import { 
  Wheat, 
  Soup, 
  Droplet, 
  Carrot, 
  Leaf, 
  Cookie, 
  Drumstick, 
  Egg, 
  Beef, 
  Fish, 
  Milk,
  Utensils,
  Pizza,
  Apple,
  Snowflake,
  Coffee,
  IceCream,
  Sandwich
} from 'lucide-react';

export const ICON_NAMES = [
  'Wheat', 
  'Soup', 
  'Droplet', 
  'Carrot', 
  'Leaf', 
  'Cookie', 
  'Drumstick', 
  'Egg', 
  'Beef', 
  'Fish', 
  'Milk', 
  'Utensils', 
  'Pizza', 
  'Apple', 
  'Snowflake', 
  'Coffee', 
  'IceCream', 
  'Sandwich'
];

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  const icons: Record<string, React.ElementType> = {
    Wheat,
    Soup,
    Droplet,
    Carrot,
    Leaf,
    Cookie,
    Drumstick,
    Egg,
    Beef,
    Fish,
    Milk,
    Utensils,
    Pizza,
    Apple,
    Snowflake,
    Coffee,
    IceCream,
    Sandwich,
    // Default fallback
    Bowl: Soup,
    Cheese: Milk
  };

  const IconComponent = icons[name] || Utensils;

  return <IconComponent className={className} size={size} />;
};

export default Icon;