import { createRoot } from 'react-dom/client';
import { SymbolCanvas } from '@/components/registry/SymbolCanvas';
import './index.css';
createRoot(document.getElementById('root')!).render(<SymbolCanvas onImageChange={() => {}} />);
