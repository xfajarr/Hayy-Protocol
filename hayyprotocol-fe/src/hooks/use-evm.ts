import { useContext } from 'react';
import { EVMContext } from '../contexts/EVMContext';

export const useEVM = () => {
  const context = useContext(EVMContext);
  if (!context) {
    throw new Error('useEVM must be used within an EVMProvider');
  }
  return context;
};
